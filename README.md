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
