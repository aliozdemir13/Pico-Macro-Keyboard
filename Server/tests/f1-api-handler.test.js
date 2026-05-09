const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const OpenF1ApiClient = require('../handlers/f1-api-handler');
const utils = require('../utils');
const axios = require('axios');
const { mockSessions, mockSessionResults, mockDrivers } = require('../tests/mock-data')

describe('OpenF1ApiClient', () => {
    let client;
    const baseUrl = 'https://api.test.com/v1';

    test('Constructor triggers background loading automatically', async (t) => {
        // This ensures the constructor's internal call is intercepted.
        // This is essential for the "Fire and Forget" test to work, as it need to control when the background loading completes.
        const requestMock = t.mock.method(OpenF1ApiClient.prototype, 'request', async () => {
            return mockSessions;
        });

        const client = new OpenF1ApiClient(baseUrl);

        // Because the constructor is "Fire and Forget", I had to use await the 
        // specific promise the constructor created.
        await client.initPromise; 

        assert.strictEqual(client.f1Sessions.length, 3, "Sessions should be loaded by constructor");
        assert.strictEqual(client.sessionsLoaded, true);
        assert.strictEqual(requestMock.mock.calls.length, 1);
    });

    test('getSessionCount waits for fire-and-forget to finish', async (t) => {
        t.mock.method(OpenF1ApiClient.prototype, 'request', async () => {
            // Simulate a slight delay to prove getSessionCount waits
            await new Promise(resolve => setTimeout(resolve, 50));
            return mockSessions;
        });

        const client = new OpenF1ApiClient(baseUrl);
        
        // getSessionCount handles the waiting internally.
        const count = await client.getSessionCount();

        assert.strictEqual(count, 3);
    });

    test('loadF1ByIndex handles missing results (Fallback to Date)', async (t) => {
            t.mock.method(OpenF1ApiClient.prototype, 'request', async (method, url) => {
            if (url.includes('/sessions')) return mockSessions;
            if (url.includes('/session_result')) return []; // Empty results trigger fallback
            if (url.includes('/drivers')) return mockDrivers;
        });

        const client = new OpenF1ApiClient(baseUrl);
        const result = await client.loadF1ByIndex(0);

        assert.strictEqual(result.row1, '02 Mar, 16:00');
        assert.ok(result.row2.includes('Sakhir'));
    });

    test('Caching mechanism prevents duplicate API calls', async (t) => {
        const requestMock = t.mock.method(OpenF1ApiClient.prototype, 'request', async (method, url) => {
            if (url.includes('/sessions')) return mockSessions;
            if (url.includes('/session_result')) return mockSessionResults;
            if (url.includes('/drivers')) return mockDrivers;
        });

        const client = new OpenF1ApiClient(baseUrl);
        
        // First load
        await client.loadF1ByIndex(0);
        // Second load (should hit cache)
        await client.loadF1ByIndex(0);

        // Filter calls to results and drivers (exclude the initial /sessions call)
        const resultCalls = requestMock.mock.calls.filter(c => c.arguments[1].includes('session_result'));
        assert.strictEqual(resultCalls.length, 1, "Should only call results API once");
    });

    test('Error handling in loadF1ByIndex returns null on API failure', async (t) => {
        t.mock.method(OpenF1ApiClient.prototype, 'request', async (method, url) => {
            if (url.includes('/sessions')) return mockSessions;
            throw new Error('Network Failure');
        });

        const client = new OpenF1ApiClient(baseUrl);
        const result = await client.loadF1ByIndex(0);

        assert.strictEqual(result, null);
    });

    test('prepareF1Sessions prevents duplicate simultaneous loading', async (t) => {
        let callCount = 0;
        t.mock.method(OpenF1ApiClient.prototype, 'request', async () => {
            callCount++;
            await new Promise(r => setTimeout(r, 50)); // Delay to keep loadingPromise active
            return mockSessions;
        });

        const client = new OpenF1ApiClient(baseUrl);
        
        // Trigger multiple loads at the same time
        const p1 = client.prepareF1Sessions();
        const p2 = client.prepareF1Sessions();
        
        await Promise.all([p1, p2]);

        assert.strictEqual(callCount, 1, "Should only trigger one network request despite multiple calls");
    });

    test('prepareF1Sessions handles API error and allows retry', async (t) => {
        let shouldFail = true;
        const requestMock = t.mock.method(OpenF1ApiClient.prototype, 'request', async (method, url) => {
            if (url.includes('/sessions')) {
                if (shouldFail) throw new Error('First Try Fail');
                return mockSessions;
            }
        });

        const client = new OpenF1ApiClient(baseUrl);
        await client.initPromise; // Wait for the auto-load to fail

        assert.strictEqual(client.sessionsLoaded, false);
        assert.strictEqual(client.f1Sessions.length, 0);

        // Second try
        shouldFail = false;
        await client.prepareF1Sessions();

        assert.strictEqual(client.sessionsLoaded, true);
        assert.strictEqual(client.f1Sessions.length, 3);
    });

    test('Driver mapping uses ??? when driver is not found in driver list', async (t) => {
        t.mock.method(OpenF1ApiClient.prototype, 'request', async (method, url) => {
            if (url.includes('/sessions')) return mockSessions;
            if (url.includes('/session_result')) return [{ position: 1, driver_number: 999 }]; // Unknown driver
            if (url.includes('/drivers')) return []; // No drivers
        });

        const client = new OpenF1ApiClient(baseUrl);
        const result = await client.loadF1ByIndex(0);

        assert.strictEqual(result.row1, '1???');
    });
});
