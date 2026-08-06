export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>TrustShield AI — System Recovery</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #0b0f19; color: #f3f4f6; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; background: rgba(17, 24, 39, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 1rem; backdrop-filter: blur(12px); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; color: #38bdf8; }
      p { color: #9ca3af; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.6rem 1.2rem; border-radius: 0.5rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; font-weight: 500; }
      .primary { background: #0284c7; color: #fff; }
      .secondary { background: transparent; color: #e0f2fe; border-color: rgba(255, 255, 255, 0.15); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>TrustShield AI — Session Refresh Needed</h1>
      <p>Connection refreshed. Click below to return to your security workspace.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Refresh Page</button>
        <a class="secondary" href="/">Go Home</a>
      </div>
    </div>
  </body>
</html>`;
}
