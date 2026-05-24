const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

process.env.NODE_ENV = 'test';

const app = require('../src/app');

let server;
let baseUrl;

before(async () =>
{
    server = await new Promise((resolve) =>
    {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });

    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () =>
{
    if (!server) return;

    await new Promise((resolve, reject) =>
    {
        server.close((error) => (error ? reject(error) : resolve()));
    });
});

test('/api/health is not blocked by the global API rate limiter', async () =>
{
    const requestCount = 120;

    for (let index = 0; index < requestCount; index += 1)
    {
        const response = await fetch(`${baseUrl}/api/health`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.success, true);
        assert.equal(body.message, 'Server is running');
    }
});
