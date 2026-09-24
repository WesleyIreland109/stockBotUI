import { Store } from './store.js';
const command = process.argv[2];
if (!['pause', 'resume', 'flatten', 'status'].includes(command)) {
    console.error('Usage: node engine/control.js pause|resume|flatten|status');
    process.exit(1);
}
const store = new Store(process.env.ENGINE_DB || './data/engine.sqlite');
if (command !== 'status') store.set('control', command === 'resume' ? 'run' : command);
console.log(JSON.stringify(store.snapshot(), null, 2));
store.close();
