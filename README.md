

# DOT-AUDIT PRO


## Cloudflare Pages

This project can be deployed to Cloudflare Pages with Pages Functions.

Use these settings in Cloudflare Pages:

- Build command: `npm run build:cloudflare`
- Build output directory: `dist`
- Root directory: `/`
- Do not set a deploy command

If a deploy command is configured in the Cloudflare dashboard (for example `npx wrangler deploy`), remove it.
Pages should only run the build command and publish `dist`.

Required runtime variable for Pages Functions:

- `HLIDAC_STATU_TOKEN` (optional, risk endpoint falls back gracefully when missing)

Local Pages preview:

```bash
npm run preview:cloudflare
```

CLI deploy to `.pages.dev`:

```bash
npm run deploy
```


View your app in AI Studio: https://ai.studio/apps/cab6f929-7694-4c90-abbc-459f02f4722a

