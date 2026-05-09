const { test, describe } = require('node:test');
const assert = require('node:assert');

// Same mock approach used in other tests to intercept SerialPort interactions without needing actual hardware. 
const mockSerialPortInstance = {
    pipe: (p) => p,
    on: () => {},
    open: () => {},
    write: () => {},
    close: () => {}
};

const mockParserInstance = {
    on: () => {}
};

// Inject mocks into Node's require cache
require.cache[require.resolve('serialport')] = {
    exports: { 
        SerialPort: function() { return mockSerialPortInstance; } 
    }
};
require.cache[require.resolve('@serialport/parser-readline')] = {
    exports: { 
        ReadlineParser: function() { return mockParserInstance; } 
    }
};

const SerialPortHandler = require('../handlers/port-handler');

// AI Supported Test
describe('SerialPortHandler Coverage', () => {

    test('open() handles success and triggers reset', (t) => {
        const logSpy = t.mock.method(console, 'log', () => {});
        
        // Setup capturing the callback and event listener
        let openCallback;
        let eventListeners = {};

        // Mock the open method to capture the callback and on method to capture event listeners
        t.mock.method(mockSerialPortInstance, 'open', (cb) => { openCallback = cb; });
        t.mock.method(mockSerialPortInstance, 'on', (event, cb) => { eventListeners[event] = cb; });
        const writeSpy = t.mock.method(mockSerialPortInstance, 'write', () => {});

        // Instantiate the handler which will call open() and set up listeners
        const handler = new SerialPortHandler('COM3', 115200);
        handler.open();

        // Trigger Success Callback (Line 12)
        openCallback(null);

        // Trigger 'open' event (Lines 19-21)
        eventListeners['open']();

        assert.ok(logSpy.mock.calls[0].arguments[0].includes('Serial Port Opened'));
        assert.strictEqual(writeSpy.mock.calls[0].arguments[0], '\x04');
    });

    test('open() handles error branch', (t) => {
        // Mock the error logging to verify it's called with the correct message
        const errorSpy = t.mock.method(console, 'error', () => {});
        
        let openCallback;
        t.mock.method(mockSerialPortInstance, 'open', (cb) => { openCallback = cb; });

        const handler = new SerialPortHandler('COM3', 115200);
        handler.open();

        // Trigger Error (Lines 13-16)
        openCallback(new Error('Port Denied'));

        assert.ok(errorSpy.mock.calls[0].arguments[0].includes('Failed to open port:'));
        assert.strictEqual(errorSpy.mock.calls[0].arguments[1], 'Port Denied');
    });

    test('sendToPico writes correctly', (t) => {
        const writeSpy = t.mock.method(mockSerialPortInstance, 'write', () => {});
        
        // Instantiate the handler and call sendToPico (Lines 24-26)
        const handler = new SerialPortHandler('COM3', 115200);
        handler.sendToPico('RowA', 'RowB');

        assert.strictEqual(writeSpy.mock.calls[0].arguments[0], 'RowA|RowB\n');
    });

    test('setupCommandListener trims data', (t) => {
        let dataCallback;
        t.mock.method(mockParserInstance, 'on', (event, cb) => {
            if (event === 'data') dataCallback = cb;
        });

        const handler = new SerialPortHandler('COM3', 115200);
        
        let result = '';
        handler.setupCommandListener(cmd => result = cmd);

        // Simulate Pico input
        dataCallback('  CMD:TOGGLE  \r\n');

        assert.strictEqual(result, 'CMD:TOGGLE');
    });
});