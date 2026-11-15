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
- Growth, health-planning, egg-production and farm-finance workflows are available in the app.

Reference: [Aviagen Ross 308 / 308 FF Broiler Performance Objectives (2022)](https://ap.aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf). The as-hatched table reports daily feed intake per living bird; local conditions can produce different results.


## Expanded farm modules
- Growth records: flock, date, sample size and average body weight. Average daily gain compares the latest two samples for the same flock.
- Health planner: farmer-entered vaccination, treatment and veterinary tasks with due/overdue status and completion tracking. It does not diagnose or prescribe.
- Layer egg collection: good and damaged egg counts, plus a simple hen-day rate based on live flock population.
- Farm cash ledger: income, expenses, category and date, with net cash balance in the selected farm currency.
- Farm intelligence: prioritized, actionable checks for feed depletion and 14-day replenishment planning, recent mortality entries, overdue/upcoming health tasks, 7-day egg-collection changes, weight-sample trends, largest expense category and recorded cash outflow exceeding income. Insights explain the underlying records and suggest a next step. No farm data is sent to an external AI service; these are transparent rules, not generative AI, diagnosis or guaranteed predictions.

All added records are included in JSON backups. Existing records are retained when the app is updated.

- The ChickenVerse research dataset is not bundled. Its published CC BY-NC-SA 4.0 licence is non-commercial; obtain separate permission or use a commercially cleared dataset before training or distributing a commercial chicken detector.
- The AI assistant and optional vision-based photo estimate are now included in the frontend, but remain inactive until the separate secure Cloudflare Worker is deployed and configured. The photo estimate is not a trained bird detector and must be manually verified. Never put private model API keys in public frontend code.


## Genuine AI assistant and optional photo estimate (secure backend)
- The AI assistant uses the OpenAI Responses API through a separate Cloudflare Worker. The browser never receives the OpenAI API key.
- The user explicitly sends each question; a limited farm-data summary and recent conversation are sent only for that request. A photo is sent only when the user explicitly requests an AI photo estimate.
- GPT-6 Luna is the default cost-efficient model and supports image input. AI photo estimates are approximate visual opinions, not dependable object detection or a replacement for manual counting. They never change flock population.
- The AI assistant is not a veterinarian, nutritionist or accountant. It must identify uncertainty, avoid disease diagnosis or medication dosing, and distinguish recorded data from assumptions.
- The OpenAI API is billed separately from a ChatGPT subscription. Create an OpenAI API project key and add it as a Cloudflare Worker secret named `OPENAI_API_KEY`. Also set `AI_ACCESS_CODE` as a separate private access code secret. Never put either secret in this GitHub repository or in the browser.
- Deploy the Worker, then enter its HTTPS URL and the same AI access code in the app's Settings. Configure the Worker allowed origin to `https://masoud-engineer.github.io`.
- AI conversations are held only in the current page session; they are not stored in farm records or cloud history. Local farm data remains on the device unless explicitly sent with an AI request.

### Deploy the AI Worker
1. Create a Cloudflare account and open **Workers & Pages** → **Create** → **Worker**.
2. Name it `poultrysmart-ai-api`. In the Worker editor, replace the starter code with `worker/index.js` from this repository and deploy.
3. Open the Worker **Settings → Variables and Secrets**. Add secrets `OPENAI_API_KEY` (your OpenAI project API key) and `AI_ACCESS_CODE` (a new private passphrase you create). Add text variables `OPENAI_MODEL=gpt-6-luna` and `ALLOWED_ORIGINS=https://masoud-engineer.github.io`.
4. Copy the Worker `workers.dev` HTTPS URL into PoultrySmart AI → Settings → Secure AI connection. Enter the same private access code and save the farm profile.
5. Test a simple question first. Keep API usage limits/budget controls enabled in your OpenAI project. Do not share the access code.

For command-line deployment, use Wrangler from the `worker` directory: `npx wrangler secret put OPENAI_API_KEY`, `npx wrangler secret put AI_ACCESS_CODE`, then `npx wrangler deploy`. The secret values are entered interactively and must not be committed.
