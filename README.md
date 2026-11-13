# Our Little Forever

A Next.js + TypeScript scrapbook website for two profiles (Aditya and Ashi).

## Run locally
1. Use Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the values.
4. Run `npm run dev`.

## Deploy to GitHub + Vercel
Push this folder to your GitHub repository, import it into Vercel, add the environment variables below, connect a **private** Vercel Blob store, then deploy.

## Environment variables
- `SITE_PASSWORD`: shared first-step password.
- `AUTH_SECRET`: long random secret used to sign session cookies.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token for private photo storage.

## Notes
- ZIP excludes `node_modules`, `.next`, and generated build output. `npm install` restores dependencies.
- Do not commit `.env.local` or real credentials to GitHub.
- Login throttling currently uses an in-memory per-instance limiter. Use a shared rate-limit store for robust production throttling.
