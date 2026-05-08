const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const axios = require('axios');
const EspnApiClient = require('../handlers/espn-api-handler');
const { mockResponseNBA, mockUclData } = require('../tests/mock-data')

describe('EspnApiClient', () => {
    let client;
    const baseUrl = 'https://api.example.com';

    beforeEach(() => {
        client = new EspnApiClient(baseUrl);
    });

    test('process NBA data', async (t) => { 
        // Mocking axios.get
        const getMock = t.mock.method(axios, 'get', async () => {
            return { status: 200, data: mockResponseNBA };
        });

        const result = await client.fetchEspnData('NBA', baseUrl, {});

        // Assertions
        assert.strictEqual(getMock.mock.calls.length, 1);
        assert.deepStrictEqual(result, mockResponseNBA.events);
    });

    test('process UCL data', async (t) => {
        // Mocking axios.get
        const getMock = t.mock.method(axios, 'get', async () => {
            return { status: 200, data: mockUclData };
        });

        const result = await client.fetchEspnData('UCL', baseUrl, {});

        // Assertions
        assert.strictEqual(getMock.mock.calls.length, 1);
        assert.deepStrictEqual(result, mockUclData.events);
    });

    test('process UCL data', async (t) => {
        // Mocking axios.get
        const getMock = t.mock.method(axios, 'get', async () => {
            return { status: 200, data: mockUclData };
        });

        const result = await client.fetchEspnData('UCL', baseUrl, {});

        // Assertions
        assert.strictEqual(getMock.mock.calls.length, 1);
        assert.deepStrictEqual(result, mockUclData.events);
    });
});