# PoultrySmart AI Worker

Secure server-side proxy for the PoultrySmart AI web app.

## Required secrets
- `OPENAI_API_KEY`: OpenAI project API key.
- `AI_ACCESS_CODE`: a private passphrase (use at least 20 random characters).

## Text variables
- `OPENAI_MODEL`: defaults to `gpt-6-luna`.
- `ALLOWED_ORIGINS`: defaults to `https://masoud-engineer.github.io`.

## Deploy with Wrangler
Run from this directory:
```sh
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put AI_ACCESS_CODE
npx wrangler deploy
```

Or create a Worker in the Cloudflare dashboard, paste `index.js`, deploy, then add both secrets and the two text variables under Settings → Variables and Secrets.

Do not commit secret values. The access code is a basic private pilot gate, not a full user-account system. For a public commercial launch, add authenticated user accounts, enforce per-user quotas and configure Cloudflare rate limiting. Do not expose the OpenAI API key in browser code.

The endpoint accepts POST JSON requests in `chat` and `image` modes, and GET health checks. It restricts browser origins and requires the app access code. User-triggered requests are forwarded to the OpenAI Responses API with `store:false`.
