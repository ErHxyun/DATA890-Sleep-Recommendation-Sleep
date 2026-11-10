"""Build the app's demo user from two public datasets.

The demo user is a composite, and every value keeps track of where it came from:
- PMData participant p06 (Fitbit Versa 2, Nov 2019 - Mar 2020): sleep stages and timing,
  resting heart rate, the morning self-report, and evening habits (alcohol, exercise).
- LifeSnaps participant 621e346f... (Fitbit Sense, 2021): overnight HRV (RMSSD),
  breathing rate and skin temperature, which PMData does not have.

For each source the script picks the most complete run of NIGHTS consecutive nights,
lines the two runs up night by night, and writes them as offsets from "last night"
(offset 0), so the app can re-date them relative to today.

Usage:
    python pipeline/build_demo_user.py <datasets_dir> [output_json]

<datasets_dir> must contain pmdata/ and lifesnaps/ as extracted from the original downloads.
Only the standard library is used.
"""

import csv
import json
import os
import sys
from datetime import date, datetime, timedelta

NIGHTS = 28
PMDATA_PARTICIPANT = "p06"
LIFESNAPS_PARTICIPANT = "621e346f67b776a24081744f"
TEMP_BASELINE_NIGHTS = 14

# Fitbit stage names -> the app's (Apple Health) stage names.
STAGE_NAMES = {"wake": "awake", "light": "core", "deep": "deep", "rem": "rem"}


def read_csv(path):
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def parse_time(text):
    return datetime.fromisoformat(text.replace(" ", "T").split(".")[0].rstrip("Z"))


def to_float(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    # LifeSnaps and PMData both write 0 where a value is missing.
    return number if number != 0 else None


# ── PMData ─────────────────────────────────────────────────────────────────────


def load_pmdata(root):
    base = os.path.join(root, "pmdata", PMDATA_PARTICIPANT)

    with open(os.path.join(base, "fitbit", "sleep.json"), encoding="utf-8") as f:
        sleeps = {
            date.fromisoformat(s["dateOfSleep"]): s
            for s in json.load(f)
            if s.get("mainSleep") and s.get("type") == "stages"
        }

    with open(os.path.join(base, "fitbit", "resting_heart_rate.json"), encoding="utf-8") as f:
        resting = {
            parse_time(r["dateTime"]).date(): to_float(r["value"]["value"]) for r in json.load(f)
        }

    # The morning wellness report describes the night that just ended.
    wellness = {}
    for row in read_csv(os.path.join(base, "pmsys", "wellness.csv")):
        wellness[parse_time(row["effective_time_frame"]).date()] = row

    # Evening habits affect the following night, so they are keyed by the next morning.
    alcohol = {}
    for row in read_csv(os.path.join(base, "googledocs", "reporting.csv")):
        day = datetime.strptime(row["date"], "%d/%m/%Y").date()
        alcohol[day + timedelta(days=1)] = row["alcohol_consumed"].strip().lower() == "yes"
    exercise_days = {
        parse_time(row["end_date_time"]).date() + timedelta(days=1)
        for row in read_csv(os.path.join(base, "pmsys", "srpe.csv"))
    }
    return sleeps, resting, wellness, alcohol, exercise_days


def sleep_record(sleep):
    """Bed/wake times as minutes from the wake day's midnight, and a stage timeline."""
    start = parse_time(sleep["startTime"])
    end = parse_time(sleep["endTime"])
    midnight = datetime.combine(end.date(), datetime.min.time())

    # Long-form stages, with Fitbit's short wakes (< 3 min) laid over them.
    timeline = []
    for item in sleep["levels"]["data"]:
        t0 = (parse_time(item["dateTime"]) - start).total_seconds() / 60
        timeline.append([STAGE_NAMES[item["level"]], t0, t0 + item["seconds"] / 60])
    for item in sleep["levels"].get("shortData", []):
        t0 = (parse_time(item["dateTime"]) - start).total_seconds() / 60
        t1 = t0 + item["seconds"] / 60
        split = []
        for stage, a, b in timeline:
            if b <= t0 or a >= t1:
                split.append([stage, a, b])
                continue
            if a < t0:
                split.append([stage, a, t0])
            if b > t1:
                split.append([stage, t1, b])
        split.append(["awake", t0, t1])
        timeline = sorted(split, key=lambda s: s[1])

    # Merge neighbours with the same stage so the chart stays readable.
    merged = []
    for stage, a, b in timeline:
        if merged and merged[-1][0] == stage and abs(merged[-1][2] - a) < 0.01:
            merged[-1][2] = b
        else:
            merged.append([stage, a, b])

    # Count only Fitbit's long-form wakes; short ones stay on the timeline but are not
    # the awakenings people remember or report.
    long_form = [
        [STAGE_NAMES[item["level"]], item["seconds"] / 60] for item in sleep["levels"]["data"]
    ]
    first_sleep = next(i for i, s in enumerate(long_form) if s[0] != "awake")
    night_wakes = [s for s in long_form[first_sleep:] if s[0] == "awake"]
    minutes = {stage: 0.0 for stage in ("awake", "core", "deep", "rem")}
    for stage, a, b in merged:
        minutes[stage] += b - a

    return {
        "bedMin": round((start - midnight).total_seconds() / 60, 1),
        "outMin": round((end - midnight).total_seconds() / 60, 1),
        "segments": [[stage, round(a, 1), round(b - a, 1)] for stage, a, b in merged],
        "asleepMin": sleep["minutesAsleep"],
        "deepMin": round(minutes["deep"]),
        "wakings": len(night_wakes),
        "awakeMin": round(sum(minutes for _, minutes in night_wakes)),
    }


def pick_pmdata_window(sleeps, resting, wellness, alcohol):
    """Most complete run of nights, ending on a night after an evening with alcohol."""
    best = None
    for end in sorted(sleeps):
        if not alcohol.get(end) or not resting.get(end):
            continue
        days = [end - timedelta(days=NIGHTS - 1 - i) for i in range(NIGHTS)]
        if not all(d in sleeps and resting.get(d) for d in days):
            continue
        score = sum((d in wellness) + (d in alcohol) for d in days)
        if best is None or score > best[0]:
            best = (score, days)
    if best is None:
        raise SystemExit("No complete PMData window found")
    return best[1]


# ── LifeSnaps ──────────────────────────────────────────────────────────────────


def load_lifesnaps(root):
    path = os.path.join(
        root, "lifesnaps", "csv_rais_anonymized", "daily_fitbit_sema_df_unprocessed.csv"
    )
    rows = {}
    for row in read_csv(path):
        if row["id"] == LIFESNAPS_PARTICIPANT:
            rows[date.fromisoformat(row["date"])] = row
    return rows


def vitals(row):
    return {
        "hrvMs": to_float(row["rmssd"]),
        "respiratoryRate": to_float(row["full_sleep_breathing_rate"]),
        "skinTempC": to_float(row["nightly_temperature"]),
    }


def pick_lifesnaps_window(rows):
    """First run of nights with every vital present and a full temperature baseline before it."""
    days = sorted(rows)
    for i in range(TEMP_BASELINE_NIGHTS, len(days)):
        window = [days[i] + timedelta(days=k) for k in range(NIGHTS)]
        if all(d in rows and all(v is not None for v in vitals(rows[d]).values()) for d in window):
            return window
    raise SystemExit("No complete LifeSnaps window found")


def temperature_deltas(rows, window):
    """Nightly skin temperature minus the mean of the previous valid nights (Apple-style delta)."""
    history = [
        vitals(rows[d])["skinTempC"]
        for d in sorted(rows)
        if d < window[0] and vitals(rows[d])["skinTempC"] is not None
    ][-TEMP_BASELINE_NIGHTS:]
    deltas = []
    for d in window:
        temp = vitals(rows[d])["skinTempC"]
        baseline = sum(history[-TEMP_BASELINE_NIGHTS:]) / len(history[-TEMP_BASELINE_NIGHTS:])
        deltas.append(round(temp - baseline, 2))
        history.append(temp)
    return deltas


# ── Main ───────────────────────────────────────────────────────────────────────


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    here = os.path.dirname(os.path.abspath(__file__))
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
        here, "..", "src", "data", "demo", "demo-user.json"
    )

    sleeps, resting, wellness, alcohol, exercise_days = load_pmdata(root)
    pm_days = pick_pmdata_window(sleeps, resting, wellness, alcohol)
    ls_rows = load_lifesnaps(root)
    ls_days = pick_lifesnaps_window(ls_rows)
    temp_deltas = temperature_deltas(ls_rows, ls_days)

    nights = []
    for i, (pm_day, ls_day) in enumerate(zip(pm_days, ls_days)):
        report = wellness.get(pm_day)
        night = {
            "offset": i - (NIGHTS - 1),
            "originalDates": {"pmdata": pm_day.isoformat(), "lifesnaps": ls_day.isoformat()},
            **sleep_record(sleeps[pm_day]),
            "restingHr": round(resting[pm_day], 1),
            "hrvMs": round(vitals(ls_rows[ls_day])["hrvMs"], 1),
            "respiratoryRate": round(vitals(ls_rows[ls_day])["respiratoryRate"], 1),
            "wristTempDeltaC": temp_deltas[i],
            "self": (
                {
                    "totalSleepMin": int(float(report["sleep_duration_h"]) * 60),
                    "sleepQuality": int(report["sleep_quality"]),
                }
                if report and report.get("sleep_duration_h")
                else None
            ),
            # Exercise is only known for evenings the participant filled in the daily log.
            "behaviors": (
                {"alcohol": alcohol[pm_day], "exercise": pm_day in exercise_days}
                if pm_day in alcohol
                else None
            ),
        }
        nights.append(night)

    demo = {
        "meta": {
            "description": "Composite demo user built from two public datasets; see sources.",
            "nights": NIGHTS,
            "hrvMetric": "RMSSD",
            "device": "Fitbit",
            "sources": {
                "pmdata": {
                    "participant": PMDATA_PARTICIPANT,
                    "fields": ["sleep", "restingHr", "self", "behaviors"],
                    "dates": [pm_days[0].isoformat(), pm_days[-1].isoformat()],
                    "citation": "Thambawita et al., PMData: a sports logging dataset, ACM MMSys 2020",
                    "license": "CC BY-NC 4.0",
                },
                "lifesnaps": {
                    "participant": LIFESNAPS_PARTICIPANT,
                    "fields": ["hrvMs", "respiratoryRate", "wristTempDeltaC"],
                    "dates": [ls_days[0].isoformat(), ls_days[-1].isoformat()],
                    "citation": "Yfantidou et al., LifeSnaps, Scientific Data 9:663 (2022)",
                    "license": "CC BY 4.0",
                },
            },
        },
        "nights": nights,
    }
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(demo, f, ensure_ascii=False, indent=1)

    with_self = sum(n["self"] is not None for n in nights)
    with_habits = sum(n["behaviors"] is not None for n in nights)
    drinks = sum(bool(n["behaviors"] and n["behaviors"]["alcohol"]) for n in nights)
    print(f"PMData {pm_days[0]} -> {pm_days[-1]}, LifeSnaps {ls_days[0]} -> {ls_days[-1]}")
    print(f"{len(nights)} nights, {with_self} self-reports, {with_habits} habit logs, {drinks} alcohol evenings")
    print(f"wrote {os.path.relpath(out)}")


if __name__ == "__main__":
    main()
