# StockBot paper account on the VM

This milestone monitors Alpaca paper balances, positions and the latest 50 orders.
It does not submit trades, implement a strategy, or keep a local trading history.
The broker host is fixed to paper-api.alpaca.markets. Live keys will not work.

Keep credentials in ~/stockbot/.env (outside ~/stockbot/app):

```env
APCA_API_KEY_ID=your_paper_key
APCA_API_SECRET_KEY=your_paper_secret
```

Start from the VM:

```bash
cd ~/stockbot/app
sudo env STOCKBOT_BIND_IP=192.168.1.196 docker compose up -d --build
sudo docker compose ps
```

Visit http://192.168.1.196:8080/paper on your LAN. The address should be reserved
in your router. The default bind address, without the override, is loopback only.
There is no application login yet: do not forward this port or publish it through
a tunnel. Connecting stockbotapp.com requires authentication before exposing
private account data. The public GitHub Pages deployment cannot run this backend.

```bash
sudo docker compose logs --tail=50 stockbot
```

The container health check reports application availability, not broker connectivity.
The paper page reports credential/network errors separately and labels retained data
as the last successful update. Account data is cached for 15 seconds server-side.
The equity change includes account flows and is not a realized trading P&L figure.

After updating credentials, recreate the container with the same start command
and add --force-recreate. Restarting alone does not reload Compose environment values.

Local checks: `node --test test/*.test.js`, `npx eslint .`, `npm run build`.
