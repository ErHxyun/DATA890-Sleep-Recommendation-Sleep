# Knowledge graph — draft v1

Structured version of Lyn's first-draft knowledge map (blue = items, green = properties,
red = recommendations). Three tables; each opens in Excel, Google Sheets, or GitHub's web editor.

| File | One row per | Key columns |
|---|---|---|
| `nodes.csv` | item in the map | `type`: outcome / mechanism / behavior / measurement / state; `properties` holds the green notes |
| `edges.csv` | line between two items | `source` → `target`, how one affects the other, and under what condition |
| `recommendations.csv` | red recommendation | what triggers it, which data it needs, and whether it is coach-level or clinician-level |

## What to fill in (clinical lead)

**Edges** — every line needs a direction and an effect for the rule engine to use it.

- `suggested_relation` is a first guess. Put the correct value in `relation`
  (use one of: `increases`, `decreases`, `supports`, `disrupts`, `regulates`, `measured_by`, `associated_with`).
- Adjust `condition` (e.g. dose, timing, duration) and add a citation in `evidence`.
- Mark `confirmed` with `yes` once checked. Delete rows that are wrong; add rows for lines we missed.

**Recommendations** — `suggested_trigger` is a placeholder threshold. Put the clinically
appropriate rule in `trigger`, add `evidence`, and mark `confirmed`.

**Rows marked `proposed`** (stress / mood, screens) are not in the draft map; keep or delete them.

## Column values

- `in_draft`: `yes` = drawn in the map, `inferred` = implied by the map, `proposed` = new suggestion
- `data_available`: whether our data (watch, check-ins, public datasets) can evaluate the trigger
- `level`: `coach` = the app suggests it; `clinician` = the app refers the user instead

Node `id`s are lowercase with underscores and are used to link the three tables, so keep them stable.
