import test from 'node:test';
import assert from 'node:assert/strict';
import { apiUrl } from '../src/api.js';

test('API routing supports same-origin VM and HTTPS public frontend', () => {
    assert.equal(apiUrl('/api/engine'), '/api/engine');
    assert.equal(apiUrl('/api/paper', 'https://api.example.com/'), 'https://api.example.com/api/paper');
    for (const base of ['http://api.example.com', 'https://secret@api.example.com', 'https://api.example.com/key', 'https://api.example.com/?token=secret']) {
        assert.throws(() => apiUrl('/api/paper', base));
    }
});
