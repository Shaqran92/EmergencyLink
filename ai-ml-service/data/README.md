# EmergencyLink — Fictional Sample Dataset & Data Dictionary

> **All records are fictional.** Hospital names don't refer to real institutions. Coordinates are placed around Karachi only so travel estimates look realistic in the demo. Do not use this data for real decisions.

Regenerate with:
```bash
python data/generate_data.py                  # reference time 2026-10-13T09:00:00Z (reproducible; used by tests)
python data/generate_data.py --rebase-to-now  # shift all timestamps so freshness looks right in a LIVE demo
```
Freshness depends on "now", so **rebase before a live demo** and re-seed MongoDB. Otherwise every report will look expired.

## Files (`sample-data/`)
| File | Rows | MongoDB collection |
|---|---:|---|
| `hospitals.json` | 12 | `hospitals` |
| `resourceSnapshots.json` | 176 | `resourceSnapshots` (latest report + 1–2 older history rows each) |
| `emergencies.json` | 10 | `emergencies` |
| `ambulances.json` | 8 | `ambulances` |
| `referrals.json` | 68 | `referrals` (66 historical + 2 live, used for escalation demo) |
| `demo-scenario.json` | 2 | ready-made `/recommendations` requests for the README §22 demo (initial ranking + after rejection) |
| `historical_arrivals_synthetic.csv` | 4,320 | synthetic hourly arrivals (180 days) for the optional forecast |
| `meta.json` | — | reference time, seed, fictional flag |

## Hospitals: each one exercises a behaviour
| ID | Name | Engineered behaviour |
|---|---|---|
| H01 | Crescent Heart Institute | Fresh, verified cardiac centre |
| H02 | Seaview Medical Centre | Close, but ICU-bed report **stale + unverified** |
| H03 | Northbridge General Hospital | Good capacity, **no cardiology / cath lab** |
| H04 | Palm Grove Hospital | ICU-bed report **expired** (5 h) → needs confirmation |
| H05 | Meridian Trauma Centre | Trauma centre, tight ICU / theatre |
| H06 | Lotus Women & Children Hospital | Maternal & paediatric |
| H07 | Sunrise Burns & Plastic Surgery Unit | Only burn unit with beds |
| H08 | Riverside Neuro Centre | **Conflicting** CT reports from two staff members |
| H09 | Greenfield District Hospital | Mostly **unverified** reports + a **future-dated** record |
| H10 | Eastgate Community Hospital | **On diversion** |
| H11 | Harborline Medical College Hospital | Large multi-specialty; some stale reports, a missing `totalCount`, burn beds full |
| H12 | Saffron Valley Hospital | **Location missing** → ETA unknown, score incomplete |

## Field dictionary
### hospitals
| Field | Type | Notes |
|---|---|---|
| hospitalId | string | unique |
| name | string | |
| location | {lat, lng} \| null | WGS-84 |
| specialties | string[] | lower-case directory services, e.g. `cardiology`, `trauma surgery` |
| status | enum | `operational` · `closed` · `diverting` · `offline` |
| fictional | bool | always true |
| _designNote | string | test-design note; strip before seeding (`_` prefix) |

### resourceSnapshots
| Field | Type | Notes |
|---|---|---|
| snapshotId | string | |
| hospitalId | string | |
| resourceType | enum string | `er_bed`, `icu_bed`, `nicu_bed`, `burn_bed`, `ventilator`, `ct_scanner`, `mri_scanner`, `cath_lab`, `operating_theatre`, `blood_bank`, `dialysis`, `trauma_team`, `neurosurgeon`, `cardiologist`, `obstetrician`, `pediatrician` |
| availableCount | int ≥ 0 \| null | null = unknown |
| totalCount | int \| null | must be ≥ availableCount |
| status | enum (optional) | `available` · `unavailable` · `unknown`; derived from count if absent |
| reportedAt | ISO UTC | when the value was reported |
| verifiedAt | ISO UTC \| null | explicit confirmation by an authorised hospital user |
| reportedBy | string | user / system id |
| version | int | record version for audit |

### emergencies
| Field | Type | Notes |
|---|---|---|
| caseId | string | unique |
| priorityCategory | `P1`/`P2`/`P3` | **assigned by a human**, never computed by the engine |
| operationalSummary | string | minimal operational description, no personal data |
| location | {lat,lng} \| null | |
| requiredResources | [{resourceType, minCount}] | hard constraints |
| requiredSpecialties | string[] | hard constraints |
| preferredResources / preferredSpecialties | string[] | soft: capability-match factor |
| status, createdAt | | |

### ambulances
`ambulanceId`, `hospitalId` (base, may be null), `status` (`available` · `assigned` · `en_route` · `arrived` · `unavailable`), `lastKnownLocation`, `lastUpdatedAt`.

### referrals
`referralId`, `caseId`, `hospitalId`, `requestStatus` (`sent` · `viewed` · `accepted` · `rejected` · `clarification_requested` · `timed_out` · `cancelled`), `requestedAt`, `responseAt`, `respondedBy`.

## Seeding MongoDB (for the MERN developer)
```bash
for c in hospitals resourceSnapshots emergencies ambulances referrals; do
  mongoimport --uri "$MONGODB_URI" --collection $c --jsonArray --drop --file data/sample-data/$c.json
done
```
Date fields are ISO strings. Convert them to `Date` on import (e.g. a Mongoose schema with `type: Date`, or a small Node seed script) so time-range queries work.
