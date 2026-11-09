# Dabi SK Health Data Capture — prototype

SK phone app and TrendX Health Data Dashboard, built from **Signed BRD_Dabi SK Health Data Capture.pdf** (v4, Phase 1), using the look of the BRAC DCS app: Roboto Slab font, pink `#fb3199`, `#f3eded` toolbar, DCS tiles, dialogs, form fields and list cards.

Demo data only. There is no SSO, NID service or server; nothing leaves the browser.

## Run locally

```bash
npm start
```

- **SK phone app:** <http://localhost:8779> (shows only the phone).
- **TrendX web platform:** <http://localhost:8779/web> (Health Data Dashboard and reports).

## Host on Render

Either option works; no build step and no dependencies.

- **Static site (free, recommended):** New → Blueprint, pick this repo; `render.yaml` sets it up. Or New → Static Site with build command empty and publish directory `.`.
- **Web service:** New → Web Service, runtime Node, build command empty (or `npm install`), start command `npm start`. The server reads Render's `PORT`.

Pages: `/` is the phone app, `/web` is the dashboard.

Open both in the same browser: a survey submitted on the phone (and synced) appears on the web dashboard within a few seconds, without reloading.

## What it covers

| BRD | In the prototype |
| --- | --- |
| FR-B-001 SSO login with PIN, restricted failed attempts | Login; demo-user chips fill the PIN; 3 wrong PINs lock for 30 s |
| Process flow: select Health application | "Select Application" screen |
| FR-B-002 Homepage with Create | Home with CREATE, Survey List, Pending Sync, Today's surveys, and recent surveys |
| FR-B-003 "Is client BRAC member or not?" | DCS-style choice dialog |
| FR-B-004 NID/Smart ID validation, profile, previous history, Proceed, member-as-non-member stop message, branch check | NID screen with every path (tap "Demo NIDs" under the Validate button), profile with tappable history, Bangla stop message, "not in current branch" block |
| Appendix 13 Mandatory Survey (General, Package 1, Package 2) | Survey form; Package 2 hides haemoglobin and urine tests; blood group optional |
| FR-B-005 optional Socio Economic Survey in dropdown format | Collapsible section with all appendix questions |
| Offline entry with auto-sync | ⋮ menu → offline mode; saves queue on the phone and sync automatically when back online |
| Process flow: BM/AM, RC/DC, HO lanes; FR-B-007 role-based visibility | Log in as BM, AM, RC, DC or HO to see the in-app dashboard for that scope |

### TrendX web platform (`web.html`)

| BRD | In the prototype |
| --- | --- |
| FR-B-006 Health Data Dashboard: Survey Summary cards (patients, members, non-members, Package 1, Package 2) and Test Summary (haemoglobin, urine, diabetes, pressure, eye, glasses yes/no), real-time from inception | Dashboard page, plus patients by the next demarcation level |
| FR-B-007 role-based demarcation | "Viewing as" in the top bar. Only the demarcation filters a role can change are shown (BM: none, AM: branch, RC: region, area, branch; DC and HO: all); the fixed part appears as text under the page title |
| Appendix: Socio-Economic Profile Data | Report with Division/Region/Area/Branch, date range, patient name and mobile filters |
| Appendix: Health Data Detailed Report | Report with the above plus package type and advance search |
| Appendix: Health Data Summary Report | One row per branch, with recipient-type filter and a Total row |
| Section 8: download in PDF and Excel | Download PDF (print to PDF, landscape) and Download Excel (CSV that opens in Excel) |

Only synced surveys reach the web platform, as they would on a real server.

## Menus

- ☰ drawer: Home, Create, Survey List, Pending Sync, Logout.
- ⋮ menu: Sync now, offline/online mode (demo), clear demo surveys, Logout.
- En / বাং switch on the login and home screens.

## Assumptions (not stated in the BRD)

- Units (cm, kg, °F, g/dL, mmol/L, mmHg) and blood-group options.
- NID must be 10, 13 or 17 digits.
- AM sees one area (from 6.2); DC can choose any division, as FR-B-007 is written.
- Detailed-report columns follow the survey fields, because the scanned column headers in the BRD are unreadable.
- The summary report has one row per branch.
