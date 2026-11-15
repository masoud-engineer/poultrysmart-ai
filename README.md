# PoultrySmart AI

Mobile-first poultry farm management PWA. This first release provides flock, feed and farm record workflows with local offline storage.

## Included
- Responsive dashboard and mobile navigation.
- Create, edit and archive flocks.
- Population calculated from initial birds and recorded additions, mortality and removals.
- User-configured daily feed target in grams per bird.
- Feed receipt and issue ledger with stock-balance validation.
- Camera photo capture and preview, with manually confirmed count-check records.
- Activity history, population summaries and feed reports.
- CSV activity export and JSON backup/restore.
- IndexedDB persistence with localStorage fallback.
- PWA manifest and service-worker app-shell caching.

## Not yet implemented
- Automatic AI chicken detection. Photo capture is not AI inference. A properly licensed model, browser runtime, representative poultry dataset and real-device validation are required.
- Cloud accounts, remote database, multi-device synchronization or user roles.
- Veterinary diagnosis or automated disease prediction.
- Universal breed-specific feed recommendations. Set feed targets using a current breed guide or qualified poultry nutrition adviser.

## Run locally
Serve this folder from localhost or deploy it to a static HTTPS host. With Python installed, run `python -m http.server 8000` in this folder, then open `http://localhost:8000`. Camera and service workers require HTTPS or localhost.

## GitHub Pages deployment
Open repository Settings, then Pages. Choose Deploy from a branch, select `main` and root folder, then Save. Wait for GitHub Pages to publish the site.

## Data and privacy
Farm data is stored in IndexedDB in this browser on this device. It is not automatically uploaded or backed up. Export a JSON backup regularly. Clearing browser data may erase records. This release has no login or encryption.

Feed target is a calculated estimate based on the grams-per-bird value entered by the farmer; it is not measured consumption or universal nutritional advice. Count-check entries do not automatically change flock population. This is a record-keeping aid, not a veterinary or accounting system.

## Technology
Vanilla HTML, CSS and JavaScript; IndexedDB with localStorage fallback; PWA manifest and service worker. No external JavaScript library is required.


## Advanced feeding reference (v2 foundation)
- Local calendar dates are generated in the device timezone rather than UTC.
- Optional Ross 308 / Ross 308 FF as-hatched daily feed-intake reference (Aviagen 2022, days 1–56) can be selected per flock. The reference is a performance objective, not a guaranteed intake; manual targets remain available.
- Additional data collections are reserved in the offline data model for future growth, health-plan, egg-production and financial modules. These modules are not yet exposed as finished workflows.

Reference: [Aviagen Ross 308 / 308 FF Broiler Performance Objectives (2022)](https://ap.aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf). The as-hatched table reports daily feed intake per living bird; local conditions can produce different results.


## Expanded farm modules
- Growth records: flock, date, sample size and average body weight. Average daily gain compares the latest two samples for the same flock.
- Health planner: farmer-entered vaccination, treatment and veterinary tasks with due/overdue status and completion tracking. It does not diagnose or prescribe.
- Layer egg collection: good and damaged egg counts, plus a simple hen-day rate based on live flock population.
- Farm cash ledger: income, expenses, category and date, with net cash balance in the selected farm currency.
- On-device farm insights: transparent rule-based prompts using recorded feed cover, mortality entries, health due dates, growth records, layer egg records and financial activity. No farm data is sent to an external AI service; this is not a generative AI veterinarian or predictive model.

All added records are included in JSON backups. Existing records are retained when the app is updated.

- The ChickenVerse research dataset is not bundled. Its published CC BY-NC-SA 4.0 licence is non-commercial; obtain separate permission or use a commercially cleared dataset before training or distributing a commercial chicken detector.
- A generative AI assistant and camera-based AI detection are not included in this static release. They require a secure backend or a properly licensed, trained and optimized on-device model. Never put private model API keys in public frontend code.
