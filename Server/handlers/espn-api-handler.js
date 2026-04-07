const ApiClient = require('./api-base-handler');
const utils = require('../utils');

class EspnApiClient extends ApiClient {
    constructor(baseUrl) {
        super(baseUrl);
    }

    async fetchEspnData(currentSport, endpoint, params) {
        try {
            if (currentSport === 'NBA') {
                const yesterday = utils.getEspnDate(-1);
                const today = utils.getEspnDate(0);
                const res = await this.request('get', `${this.baseUrl}/basketball/nba/scoreboard?dates=${yesterday}-${today}`);
                return res.events || []
            } else if (currentSport === 'UCL' || currentSport === 'UEL') {
                const slug = currentSport === 'UCL' ? 'uefa.champions' : 'uefa.europa';
                const res = await this.request('get', `${this.baseUrl}/soccer/${slug}/scoreboard`);
                return res.events || [];
            } else if (currentSport === 'NFL') {
                const res = await this.request('get', `${this.baseUrl}/football/nfl/scoreboard`);
                return res.events || [];
            } else if (currentSport === 'NASCAR' || currentSport === 'IRL') {
                const slug = currentSport === 'NASCAR' ? 'nascar-premier' : 'irl';
                const beginning = utils.getEspnDate(-utils.getDaysSinceNewYear())
                const today = utils.getEspnDate(0);
                const res = await this.request('get', `${this.baseUrl}/racing/${slug}/scoreboard?dates=${beginning}-${today}`);
                return res.events || [];
            }
        } catch (error) {
            console.error(`Error fetching ESPN data from ${endpoint}:`, error.message);
        }
    }
}

module.exports = EspnApiClient;