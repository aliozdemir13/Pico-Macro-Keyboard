const EspnApiClient = require('./handlers/espn-api-handler');
const OpenF1ApiClient = require('./handlers/f1-api-handler');
const SerialPortHandler = require('./handlers/port-handler');
const { mockResponseNBA } = require('../tests/mock-data')

// 1. Mock the dependencies
jest.mock('./handlers/espn-api-handler');
jest.mock('./handlers/f1-api-handler');
jest.mock('./handlers/port-handler');
jest.mock('./utils', () => ({
    formatToLocal: jest.fn(() => 'Mocked Date')
}));

// Mock environment variables
process.env.ESPN_BASE_URL = 'http://test';
process.env.OPENF1_BASE_URL = 'http://test';
process.env.PICO_PORT = 'COM3';

describe('Sports Ticker Logic', () => {
    let mockEspnFetch;
    let mockSendToPico;
    let commandCallback;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Capture the command listener callback so we can trigger it manually
        SerialPortHandler.prototype.setupCommandListener.mockImplementation((cb) => {
            commandCallback = cb;
        });

        mockSendToPico = SerialPortHandler.prototype.sendToPico;
        mockEspnFetch = EspnApiClient.prototype.fetchEspnData;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should fetch ESPN data and format it correctly for general sports', async () => {
        // Mock API response for NBA
        mockEspnFetch.mockResolvedValue(mockResponseNBA);

        // Require the index file (this starts the script)
        require('./index');

        // Fast-forward the 2-second initial timeout
        jest.advanceTimersByTime(2001);

        // We need to wait for the Promise in fetchData to resolve
        await Promise.resolve(); 

        expect(mockEspnFetch).toHaveBeenCalledWith('NBA', '', {});
        expect(mockSendToPico).toHaveBeenCalledWith('LAL 100v102 BOS', 'Final');
    });

    test('should handle NASCAR specific formatting logic', async () => {
        mockEspnFetch.mockResolvedValue([{
            shortName: 'NASCAR Cup Series Cook Out 400',
            competitions: [{
                competitors: [{
                    athlete: { shortName: 'Larson' }
                }]
            }]
        }]);

        // Manually trigger the sport toggle (assuming we are at index 4 for NASCAR)
        // Note: Because index.js uses global variables, this is tricky. 
        // In a real test, you'd trigger commandCallback("CMD:TOGGLE_SPORT") several times.
        
        // Simulating the logic manually:
        // Trigger command multiple times to reach NASCAR
        for(let i=0; i<4; i++) {
            commandCallback("CMD:TOGGLE_SPORT");
            await Promise.resolve();
        }

        expect(mockSendToPico).toHaveBeenLastCalledWith('1-Larson', 'Cook Out 400');
    });

    test('should handle API errors gracefully', async () => {
        mockEspnFetch.mockRejectedValue(new Error('Network Fail'));
        
        require('./index');
        jest.advanceTimersByTime(2001);
        await Promise.resolve();

        expect(mockSendToPico).toHaveBeenCalledWith('API ERROR|Check Node\n');
    });
});