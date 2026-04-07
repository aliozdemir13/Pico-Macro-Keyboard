const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class SerialPortHandler {
    constructor(portPath, baudRate) {
        this.port = new SerialPort({ path: portPath, baudRate });
        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    }

    open() {
        this.port.open(err => {
            if (err) {
                console.error('Failed to open port:', err.message);
                return;
            }
        });

        this.port.on('open', () => {
            console.log('Serial Port Opened. Sending Soft Reset to Pico...');
            this.port.write('\x04'); // Ctrl+D
        });
    }

    sendToPico(row1, row2) {
        console.log(`Sending: ${row1} | ${row2}`);
        this.port.write(`${row1}|${row2}\n`);
    }

    setupCommandListener(callback) {
        this.parser.on('data', (data) => {
            const cmd = data.trim();
            callback(cmd);
        });
    }
}

module.exports = SerialPortHandler;