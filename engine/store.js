import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class Store {
    constructor(path) {
        if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
        this.db = new DatabaseSync(path);
        this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
            CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, time TEXT NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS intents (client_id TEXT PRIMARY KEY, date TEXT NOT NULL, kind TEXT NOT NULL, symbol TEXT NOT NULL, body TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0);
            CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, client_id TEXT, symbol TEXT, side TEXT, qty REAL, filled REAL, price REAL, status TEXT, updated TEXT);
            CREATE TABLE IF NOT EXISTS samples (time TEXT PRIMARY KEY, equity REAL NOT NULL);
            CREATE TABLE IF NOT EXISTS lease (id INTEGER PRIMARY KEY, owner TEXT, expires REAL);
            INSERT OR IGNORE INTO lease VALUES (1, '', 0);
        `);
    }
    get(key, fallback = null) { const row = this.db.prepare('SELECT value FROM state WHERE key=?').get(key); return row ? JSON.parse(row.value) : fallback; }
    claim(owner, now) {
        return this.db.prepare('UPDATE lease SET owner=?, expires=? WHERE id=1 AND (owner=? OR expires<?)').run(owner, now + 120000, owner, now).changes > 0;
    }
    release(owner) { this.db.prepare('UPDATE lease SET expires=0 WHERE owner=?').run(owner); }
    set(key, value) { this.db.prepare('INSERT OR REPLACE INTO state VALUES (?,?)').run(key, JSON.stringify(value)); }
    event(type, message, now) {
        this.db.prepare('INSERT INTO events(time,type,message) VALUES (?,?,?)').run(now.toISOString(), type, message);
        this.db.exec('DELETE FROM events WHERE id < (SELECT MAX(id)-10000 FROM events)');
    }
    reserve(body, kind, date) {
        return this.db.prepare('INSERT OR IGNORE INTO intents(client_id,date,kind,symbol,body) VALUES (?,?,?,?,?)')
            .run(body.client_order_id, date, kind, body.symbol, JSON.stringify(body)).changes > 0;
    }
    intents() { return this.db.prepare('SELECT * FROM intents').all(); }
    orderIds() { return this.db.prepare('SELECT id FROM orders').all().map(row => row.id); }
    resolve(id) { this.db.prepare('UPDATE intents SET resolved=1 WHERE client_id=?').run(id); }
    count(date) { return this.db.prepare("SELECT COUNT(*) AS count FROM intents WHERE date=? AND kind='entry'").get(date).count; }
    observe(order, now) {
        const old = this.db.prepare('SELECT * FROM orders WHERE id=?').get(order.id);
        this.db.prepare('INSERT OR REPLACE INTO orders VALUES (?,?,?,?,?,?,?,?,?)').run(order.id, order.client_order_id || '', order.symbol, order.side,
            Number(order.qty || 0), Number(order.filled_qty || 0), order.filled_avg_price == null ? null : Number(order.filled_avg_price), order.status, now.toISOString());
        if (!old || old.status !== order.status || old.filled !== Number(order.filled_qty || 0)) {
            this.event('order', `${order.symbol} ${order.side}: ${order.status}; filled ${order.filled_qty || 0}/${order.qty || 0}${order.filled_avg_price ? ` at $${order.filled_avg_price}` : ''}.`, now);
        }
        for (const leg of order.legs || []) this.observe(leg, now);
    }
    ownedQuantity(symbol) {
        return this.db.prepare("SELECT COALESCE(SUM(CASE side WHEN 'buy' THEN filled ELSE -filled END),0) AS qty FROM orders WHERE symbol=?").get(symbol).qty;
    }
    snapshot() {
        return {
            ...this.get('status', { state: 'starting', reason: 'Waiting for first engine cycle.' }),
            control: this.get('control', 'run'),
            day: this.get('day'),
            signals: this.get('signals', []),
            events: this.db.prepare('SELECT * FROM events ORDER BY id DESC LIMIT 100').all(),
            history: this.db.prepare('SELECT * FROM (SELECT * FROM samples ORDER BY time DESC LIMIT 1000) ORDER BY time').all(),
        };
    }
    sample(now, equity) {
        const minute = now.toISOString().slice(0, 16);
        if (Number.isFinite(equity)) this.db.prepare('INSERT OR IGNORE INTO samples VALUES (?,?)').run(`${minute}:00.000Z`, equity);
        this.db.exec('DELETE FROM samples WHERE time < (SELECT time FROM samples ORDER BY time DESC LIMIT 1 OFFSET 50000)');
    }
    close() { this.db.close(); }
}
