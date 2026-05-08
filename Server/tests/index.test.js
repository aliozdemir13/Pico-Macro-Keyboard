const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');

// Learning from mocking the hardware (AI supported code block):
// MOCK MODULES BEFORE REQUIRING APP
// This prevents the SerialPort from ever trying to touch hardware.
// This aims to mock the node package SerialPort to avoid having any hardware dependency
const mockSerial = {
    SerialPort: class {
        constructor() { this.isOpen = false; } // avoid any try for opening a port
        pipe(p) { return p; } // instead of connecting to a data stream, returns the parse for being able to test and mock what is expected to be sent to port
        on(event, cb) { if (event === 'open') setTimeout(cb, 10); return this; } // this silence the event listener
        write(data) { return true; } // pretend writer to trick the code about "something has been written to hardware"
        open(cb) { this.isOpen = true; if(cb) cb(); } // Real serial ports take time to open and use a callback (cb). This line ensures any given callback function runs it immediately
    },
    // fake reader
    ReadlineParser: class {
        constructor() { }
        on() { return this; }
    }
};

// this is the most critical part, mocking the serial port by injecting mock version to ndoe library
// require.resolve('serialport'): Finds the exact file path where the real serialport library lives on your hard drive.
// require.cache: This is a giant internal dictionary where Node.js stores every library it has already loaded.
// The Assignment: We are manually sticking our mockSerial object into Node's memory, pretending it’s the real library.
require.cache[require.resolve('serialport')] = { exports: mockSerial };
// end of AI supported code

const ApiClient = require('../handlers/api-base-handler');
const { mockResponseNBA, mockUclData, mockUelData } = require('./mock-data');

const app = require('../index'); // TODO: use dependency injection as the code currently is not very much testable by design

describe('Sports Results Integration Logic Commands Test', () => {

    beforeEach(() => {
        // Reset state via the exported setters
        app.setSportIndex(0);
        app.setMasterList([]);
        app.setCurrentIndex(0);
    });

    test('Full Flow: NBA Data Fetch to Serial Port Write', async (t) => {
        t.mock.timers.enable({ apis: ['setTimeout'] });

        // Mock API response
        t.mock.method(ApiClient.prototype, 'request', async () => []);
        t.mock.method(app.espnApiClient, 'fetchEspnData', async () => mockResponseNBA.events);

        // This ensures the formatting logic inside index.js is executed and covered. - AI Supported Code Block
        const portWriteSpy = t.mock.method(app.serialPortHandler, 'sendToPico', () => {});

        await app.fetchData(); 
 
        // Wait for process - end of AI Supported Code Block
        await new Promise(res => setImmediate(res));

        // Assertions
        const calls = portWriteSpy.mock.calls;
        assert.strictEqual(calls.length, 1, "Should have called SerialPortHandler");
        assert.ok(calls[0].arguments[0].includes('CLE 107v97 DET'), "Formatted NBA score missing");
        assert.strictEqual(calls[0].arguments[1], 'Final');
    });

    test('Full Flow: NASCAR Branch Coverage', async (t) => {
        // Setup NASCAR state
        app.setSportIndex(5); // NASCAR
        app.setMasterList([{ 
            shortName: 'NASCAR Cup Series at Daytona',
            competitions: [{ competitors: [{ athlete: { shortName: 'Blaney' } }] }] 
        }]);

        const portWriteSpy = t.mock.method(app.serialPortHandler, 'sendToPico', () => {});

        // Trigger logic
        app.sendToPico();

        // Check the NASCAR string normalization
        const lastCall = portWriteSpy.mock.calls[0].arguments;
        assert.strictEqual(lastCall[0], '1-Blaney');
        assert.strictEqual(lastCall[1], 'at Daytona'); // Tests the .split() logic
    });

    test('Full Flow: F1 Branch Coverage', async (t) => {
        app.setSportIndex(3); // F1
        app.setMasterList([{ row1: 'VER PER HAM', row2: 'Monaco GP' }]);

        const portWriteSpy = t.mock.method(app.serialPortHandler, 'sendToPico', () => {});

        app.sendToPico();

        assert.strictEqual(portWriteSpy.mock.calls[0].arguments[0], 'VER PER HAM');
    });


    test('Command Listener: Toggle Logic Integration', async (t) => {
        // Mock the API to return UCL data when called
        t.mock.method(app.espnApiClient, 'fetchEspnData', async () => mockUclData.events);
        const portWriteSpy = t.mock.method(app.serialPortHandler, 'sendToPico', () => {});

        // Capture the command listener that index.js registered
        let capturedCallback;
        t.mock.method(app.serialPortHandler, 'setupCommandListener', (cb) => {
            capturedCallback = cb;
        });

        // AI Supported Code - it needed to re-run the listener setup because we mocked it triggered the one index.js already created
        app.setSportIndex(0); // Start at NBA
        
        // This simulates the Pico sending the command string
        // Since index.js uses serialPortHandler.setupCommandListener, trigger the logic inside index.js is needed
        // Note: I need to manually trigger the callback registered in index.js
        // via app.serialPortHandler.parser.emit('data', 'CMD:TOGGLE_SPORT')
        app.serialPortHandler.parser.emit('data', 'CMD:TOGGLE_SPORT');

        await new Promise(res => setImmediate(res));

        assert.strictEqual(app.getSportIndex(), 1, "Sport Index should have moved to UCL (1)");
    });

    test('Error Handling: API Failure coverage', async (t) => {
        t.mock.method(app.espnApiClient, 'fetchEspnData', async () => {
            throw new Error("Network Timeout");
        });
        const portWriteSpy = t.mock.method(app.serialPortHandler, 'sendToPico', () => {});

        await app.fetchData();

        assert.ok(portWriteSpy.mock.calls[0].arguments[0].includes('API ERROR'));
    });
});