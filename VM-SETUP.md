# StockBot paper engine on Proxmox

The engine runs every 20 seconds in the app's Node 24 container. It only sends
orders to Alpaca's paper endpoint. No live mode exists. Use a dedicated, initially
empty paper account; do not mix manual orders with this bot. Existing positions
or orders on first launch cause it to wait without modifying them.

## Enable on the VM

Keep your existing keys in ~/stockbot/.env and add the enable flag:

```env
APCA_API_KEY_ID=your_paper_key
APCA_API_SECRET_KEY=your_paper_secret
PAPER_TRADING_ENABLED=true
```

```bash
cd ~/stockbot/app
git pull --ff-only
nano ~/stockbot/.env
sudo env STOCKBOT_BIND_IP=192.168.1.196 docker compose up -d --build
sudo docker compose ps
```

Visit http://192.168.1.196:8080/paper. Reserve this IP in the router.
Without STOCKBOT_BIND_IP the container port binds only to loopback.
Recreate the container after changing .env; restart alone does not reload it.

## Strategy and limits

- SPYM (S&P 500) and SCHG (U.S. large-cap growth), whole shares, long-only,
  one position at a time. These lower-share-price ETFs allow a $1,000 paper
  account to trade without increasing allocation limits or removing bracket
  protection. SCHG is not a Nasdaq-100 tracker.
- Free IEX feed, which covers one exchange rather than the consolidated market.
- Technical Indicators computes a 5-period SMA crossing above a 20-period SMA.
  Only complete, consecutive five-minute regular-session bars count. It needs
  21 bars that day, so the first possible signal is after 11:15 ET.
- Limit entry with a broker bracket: 1% stop and 2% target. Entry orders not fully
  filled after a minute are canceled; partial positions are then flattened.
- Each position is capped at $1,000, 10% equity, available cash, and planned stop
  risk of 0.25% equity. No borrowing. Quotes older than 30 seconds or spreads
  greater than 0.2% are skipped. Stop orders do not guarantee a maximum loss.
- At $1,000 equity the position budget is $100 and the daily loss threshold is
  $10. A $35 ask allows two shares; an $85 ask allows one. Actual quotes and
  cash determine sizing; no trade is forced if data or a signal is missing.
  Use an empty account when upgrading from the old SPY/QQQ strategy. Existing
  holdings in those symbols will trigger the account-mismatch guard.
- Maximum six entry attempts per New York calendar day, including rejections.
- A 1% equity decline from prior close triggers liquidation and a halt for that day.
  This uses account equity, not realized strategy P&L; transfers affect it.
- No entries in the last 30 minutes of the broker-reported session. Liquidation
  starts 10 minutes before close, including early-close days. Cancellation must
  be confirmed before an exit sell is submitted.
- VM/network outages, trading halts, or rejections can prevent an exit. Leftover
  positions are flagged and the engine attempts to close them at the next open.

This is an experimental strategy, not a demonstrated profitable edge. It can
legitimately make no trades. The dashboard shows signals and skipped decisions.

## VM-only controls

There are no HTTP trading controls. Public endpoints are read-only.

```bash
sudo docker compose exec stockbot node engine/control.js status
sudo docker compose exec stockbot node engine/control.js pause
sudo docker compose exec stockbot node engine/control.js resume
sudo docker compose exec stockbot node engine/control.js flatten
sudo docker compose logs --tail=50 stockbot
```

Pause blocks entries but continues existing order management and session exits.
Flatten cancels bot orders, sells bot positions when the market is open, then pauses.
Flatten and verify positions are empty before stopping the container. Setting
PAPER_TRADING_ENABLED=false stops all management, including scheduled exits.

## Persistence and recovery

The engine-data Docker volume stores SQLite order intents, fill observations,
daily limits, processed bars, control state, and equity samples. Normal rebuilds
retain it. Do not use `docker compose down -v`, which deletes the ledger.
Run one container with one shared ledger per paper account.

A worker lease prevents two processes sharing that ledger from placing orders
at once. Recovery after a hard crash can take two minutes. Order intent is saved
before submission; uncertain results are looked up by client ID, never blindly
resent. Persistent unknown orders require investigation in Alpaca. Account changes
or manual trades that disagree with the ledger also stop actions.

The dashboard shows the latest 100 events and 1,000 equity samples. Storage keeps
10,000 events, 50,000 minute samples, and all order records. These records are not
a tax ledger. Health checks cover HTTP uptime; engine errors appear separately.

## Public paper results

Paper results have no login, per your preference. Credentials and account IDs are
excluded from responses. Pause/resume/flatten require access to the VM console.
The frontend stays on GitHub Pages; the engine stays on this VM. A public HTTPS
proxy/tunnel must route to the StockBot container, never to Proxmox or Docker.
The API permits browser reads from stockbotapp.com and www.stockbotapp.com.
Once that stable HTTPS origin exists, deploy the frontend from your development
machine with the origin (not an API key):

```bash
VITE_API_BASE_URL=https://YOUR-API-HOST npm run deploy
```

The deploy command explicitly targets WesleyIreland109/stockBotUI, not the legacy
organization repository. With no VITE_API_BASE_URL, the frontend uses same-origin
API routes, appropriate for the VM but not GitHub Pages. Do not use a private LAN
address for the public build. No broker credentials belong in VITE variables.
A temporary tunnel is demo-only: changing its address requires redeploying the
frontend. GitHub Pages cannot run the engine. These code changes alone do not
change DNS or expose the VM publicly.
Revisit access controls before any future live-money version.

### Permanent Cloudflare connection

Deployment completed on September 24, 2026. The active connector is the standalone
Docker container `stockbot-tunnel`, created from the Cloudflare Docker command,
attached to `app_default`, with restart policy `unless-stopped`. Its existing
credential remains in Docker; no `tunnel.env` file is needed for that container.
Do not start the optional Compose connector as a duplicate. The instructions below
describe the Compose alternative for a future reinstall.

Public dashboard: https://stockbotapp.com/paper. Public API origin:
https://api.stockbotapp.com. `npm run deploy` builds against that API and publishes
to the personal GitHub repository. The root and www DNS records remain DNS-only
and point directly to GitHub Pages. Cloudflare manages DNS while Squarespace
remains the registrar. The unrelated mirage-api tunnel was not changed.

The first paper trade exposed a bracket-order ownership bug: Alpaca can return
exit legs as roots after the entry fills. This was fixed and regression-tested.
The September 24 SCHG position remained open after close; the engine will attempt
to flatten it at the next regular-session open. Do not treat this first day as
evidence of reliable end-of-day liquidation or profitability.

Keep the domain registered at Squarespace and the website on GitHub Pages.
Cloudflare's free named tunnel requires the domain's DNS to be on Cloudflare.
Before changing nameservers, copy and verify all existing DNS records, including
mail and verification records. Coordinate DNSSEC migration if it is enabled.

Create a remotely managed tunnel named `stockbot` in Cloudflare. Add the public
hostname `api.stockbotapp.com`, path `^/api/(engine|paper|metrics)$`, pointing to
HTTP service `stockbot:5174`. Keep the default unmatched-route 404. Do not add
private network routes, Proxmox, SSH, or Docker management endpoints.

Put only `TUNNEL_TOKEN=your_tunnel_token` in `~/stockbot/tunnel.env`, owned by
your VM user with mode 600. Enter it privately on the VM, not in Git or chat.
This credential is separate from the Alpaca keys. Then:

```bash
cd ~/stockbot/app
sudo env STOCKBOT_BIND_IP=192.168.1.196 docker compose --profile public up -d
```

The connector has no published host ports. Both services restart automatically
unless explicitly stopped. Never expose the Docker socket or mount the engine
data volume into the connector. The cloudflared image is updated only when
explicitly pulled; update it periodically during a maintenance window.

After verifying the public API returns fresh JSON, publish from the development
machine with `VITE_API_BASE_URL=https://api.stockbotapp.com npm run deploy`.
The user-facing dashboard is https://stockbotapp.com/paper. Home internet or VM
outages will interrupt the live dashboard and can interrupt trading management.

## Verification

`npm test`, `npx eslint .`, `npm run build`.
Tests use a fake broker and never send actual orders. Docker and a real paper
account connection must be verified on the VM.
