require('dotenv').config();

const EspnApiClient = require('./handlers/espn-api-handler');
const OpenF1ApiClient = require('./handlers/f1-api-handler');
const SerialPortHandler = require('./handlers/port-handler');
const { formatToLocal } = require('./utils');

const espnBaseURL = process.env.ESPN_BASE_URL;
const openF1BaseURL = process.env.OPENF1_BASE_URL;
const picoPort = process.env.PICO_PORT;

const espnApiClient = new EspnApiClient(espnBaseURL);
const openF1ApiClient = new OpenF1ApiClient(openF1BaseURL);

const serialPortHandler = new SerialPortHandler(picoPort, 115200);

let masterList = [];
let currentIndex = 0;
const sportsOrder = ['NBA', 'UCL', 'UEL', 'F1', 'NFL', 'NASCAR', 'IRL'];
let sportIndex = 0;

async function fetchData() {
    const currentSport = sportsOrder[sportIndex];
    console.log('currentSport ', currentSport)
    try {
        let data;
        if (currentSport === 'F1') {
            const item = await openF1ApiClient.loadF1ByIndex(currentIndex);
            data = item ? [item] : [];
        } else {
            data = await espnApiClient.fetchEspnData(currentSport, '', {});
        }

        masterList = data;
        console.log(`${currentSport} Total: ${masterList.length}`);
        sendToPico();
    } catch (err) {
        console.error('Global API Error:', err.message);
        serialPortHandler.sendToPico(`API ERROR|Check Node\n`);
    }
}

function sendToPico() {
    const currentSport = sportsOrder[sportIndex];
    if (masterList.length === 0) {
        serialPortHandler.sendToPico(`${currentSport}|No Data Found\n`);
        return;
    }

    let row1 = '', row2 = '';
    const item = masterList[currentSport === 'F1' ? 0 : currentIndex];

    // Custom logic for each sport
    if (currentSport === 'F1') {
        row1 = item.row1;
        row2 = item.row2;
    } else if (currentSport === 'NASCAR' || currentSport === 'IRL') {
        const competitors = item.competitions[0].competitors;
        const winner = competitors[0];
        const winnerName = winner.athlete?.shortName || "TBD";
        let circuit = item.shortName.substring(0, 16);

        if (item.shortName.includes('NASCAR Cup Series ')) {
            circuit = item.shortName.split('NASCAR Cup Series ')[1];
        } else if (item.shortName.includes('NASCAR CUP SERIES ')) {
            circuit = item.shortName.split('NASCAR CUP SERIES ')[1];
        } else if (item.shortName.includes('Grand Prix of ')) {
            circuit = item.shortName.split('Grand Prix of ')[1];
        }

        row1 = `1-${winnerName}`.substring(0, 20);
        row2 = circuit.substring(0, 20);
    } else {
        const team1 = item.competitions[0].competitors[0];
        const team2 = item.competitions[0].competitors[1];
        const status = item.status.type.shortDetail.substring(0, 16) !== 'Scheduled' ?
                        item.status.type.shortDetail.substring(0, 16) :
                        formatToLocal(new Date(item.date)).replace(', ', ' - ').substring(0, 16);

        const name1 = team1.team?.abbreviation || "??";
        const name2 = team2.team?.abbreviation || "??";

        row1 = `${name1} ${team1.score}v${team2.score} ${name2}`;
        row2 = status;
    }

    serialPortHandler.sendToPico(row1, row2);
}

serialPortHandler.setupCommandListener((cmd) => {
    const currentSport = sportsOrder[sportIndex];

    if (cmd === "CMD:NEXT" || JSON.stringify(cmd).includes("CMD:NEXT")) {
        if (currentSport === 'F1') {    
            console.log('currentIndex ', currentIndex)        
            let totalSessions = openF1ApiClient.f1Sessions.length;
            if (totalSessions > 0) {
                currentIndex = (currentIndex + 1) % totalSessions;
                console.log('currentIndex ', currentIndex)        
                fetchData();
            }
        } else if (masterList.length > 0) {
            currentIndex = (currentIndex + 1) % masterList.length;
            sendToPico();
        }
    } else if (cmd === "CMD:TOGGLE_SPORT" || JSON.stringify(cmd).includes("CMD:TOGGLE_SPORT")) {
        sportIndex = (sportIndex + 1) % sportsOrder.length;
        currentIndex = 0;
        masterList = [];
        fetchData();
    }
});

setTimeout(fetchData, 2000);
setInterval(fetchData, 300000);