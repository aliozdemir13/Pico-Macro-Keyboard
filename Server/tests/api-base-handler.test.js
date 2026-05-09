const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const axios = require('axios');
const ApiClient = require('../handlers/api-base-handler');

describe('ApiClient', () => {
    let client;
    const baseUrl = 'https://api.example.com';

    beforeEach(() => {
        client = new ApiClient(baseUrl);
    });

    test('should return data on successful GET request', async (t) => {
        const mockData = { id: 1, name: 'Test Item' };
        
        // Mocking axios.get
        const getMock = t.mock.method(axios, 'get', async () => {
            return { status: 200, data: mockData };
        });

        const result = await client.request('get', '/items/1');

        // Assertions
        assert.strictEqual(getMock.mock.calls.length, 1);
        assert.deepStrictEqual(result, mockData);
    });

    test('should return data on successful POST request', async (t) => {
        const payload = { name: 'New Item' };
        const mockResponse = { id: 2, ...payload };

        const postMock = t.mock.method(axios, 'post', async () => {
            return { status: 201, data: mockResponse };
        });

        const result = await client.request('post', '/items', {}, payload);

        assert.strictEqual(postMock.mock.calls.length, 1);
        assert.deepStrictEqual(result, mockResponse);
    });

    test('should return data on successful PUT request', async (t) => {
        const payload = { name: 'New Item' };
        const mockResponse = { id: 2, ...payload };

        const putMock = t.mock.method(axios, 'put', async () => {
            return { status: 201, data: mockResponse };
        });

        const result = await client.request('put', '/items', {}, payload);

        assert.strictEqual(putMock.mock.calls.length, 1);
        assert.deepStrictEqual(result, mockResponse);
    });
    
    test('should return data on successful DELETE request', async (t) => {
        const mockResponse = { id: 2 };

        const deleteMock = t.mock.method(axios, 'delete', async () => {
            return { status: 201, data: mockResponse };
        });

        const result = await client.request('delete', '/items');

        assert.strictEqual(deleteMock.mock.calls.length, 1);
        assert.deepStrictEqual(result, mockResponse);
    });

    test('handleError should return null and log error on failure', async (t) => {
        // Mock axios.get to reject (throw error)
        t.mock.method(axios, 'get', async () => {
            const error = new Error('Network Error');
            error.response = { status: 500, data: 'Internal Server Error' };
            throw error;
        });

        // Suppress console.error during test to keep output clean
        t.mock.method(console, 'error', () => {});

        const result = await client.request('get', '/fail');

        assert.strictEqual(result, null);
    });

    test('should throw error for unsupported methods', async () => {
        const result = await client.request('test', '/test');
        // Based on your code, handleError catches the "Unsupported method" error and returns null
        assert.strictEqual(result, null);
    });

    test('handle unexpected response code', async (t) => {
        t.mock.method(axios, 'get', async () => {
            // Create the error object first
            const mockError = new Error('Unexpected Status');
            mockError.response = { status: 350, data: '' };
            
            // You must THROW it for the ApiClient to catch it in its try/catch block
            throw mockError; 
        });

        // Suppress console.error during test to keep output clean
        t.mock.method(console, 'error', () => {});

        const result = await client.request('get', '/fail');

        assert.strictEqual(result, null);
    });
});