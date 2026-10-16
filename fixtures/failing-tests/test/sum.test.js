const test = require('node:test');
const assert = require('node:assert');
test('passes', () => assert.equal(1 + 1, 2));
test('pre-existing failure', () => assert.equal(1 + 1, 3));
