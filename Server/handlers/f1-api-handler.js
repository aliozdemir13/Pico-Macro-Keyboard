const ApiClient = require('./api-base-handler');
const utils = require('../utils')

class OpenF1ApiClient extends ApiClient {
    constructor(baseUrl) {
        super(baseUrl);
        this.f1Sessions = [];
        this.f1Cache = new Map();
        this.sessionsLoaded = false;
        
        // FIRE AND FORGET: Start loading immediately in the background
        this.initPromise = this.prepareF1Sessions(); 
    }

    async prepareF1Sessions() {
        // If already loaded, do nothing
        if (this.sessionsLoaded) {
            return;
        }
        
        // If a request is already in progress, return the existing promise
        // This prevents "overwriting" or duplicate API calls
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        const currentYear = new Date().getFullYear();
        
        this.loadingPromise = (async () => {
            console.log('F1 Background Loading started...');
            try {
                const res = await this.request('get', `${this.baseUrl}/sessions?year=${currentYear}&session_type=Race`);
                console.log(`F1 Background Loading: ${res.length} sessions fetched.`);
                this.f1Sessions = res || [];
                //console.log(`F1 Background Loading completed. ${this.f1Sessions} sessions loaded.`);
                this.sessionsLoaded = true;
            } catch (error) {
                console.error(`Error loading F1 session list: ${error.message}`);
                this.f1Sessions = [];
            } finally {
                this.loadingPromise = null; // Clear promise so it can retry if failed
            }
        })();

        return this.loadingPromise;
    }

    async getSessionCount() {
        // Even if fire-and-forget started it, we must ensure it's FINISHED before returning count
        if(this.f1Sessions.length === 0) {
            await this.prepareF1Sessions(); 
        }
        return this.f1Sessions.length;
    }

    async loadF1ByIndex(index) {
        // Guarantees the background task is finished before proceeding
        if(this.f1Sessions.length === 0) {
            await this.prepareF1Sessions(); 
        }
        
        const session = this.f1Sessions[index];
        if (!session) {
            return null;
        }

        const cacheKey = `result_${session.session_key}`;

        if (this.f1Cache.has(cacheKey)) {
            return this.f1Cache.get(cacheKey);
        }

        try {
            const [resRes, resDrivers] = await Promise.all([
                this.request('get', `${this.baseUrl}/session_result?session_key=${session.session_key}&position%3C%3D3`),
                this.request('get', `${this.baseUrl}/drivers?session_key=${session.session_key}`)
            ]);
 
            if (!resRes?.length) {
                let circuitName = session.circuit_short_name;
                if (circuitName === 'Spa-Francorchamps') circuitName = 'Spa';
                if (circuitName === 'Interlagos') circuitName = 'Brazil';
                return {
                    row1: utils.formatToLocal(session.date_start),
                    row2: `${circuitName} ${session.session_name.substring(0, 7)}`,
                    sport: 'F1'
                };
            }

            const driverMap = {};
            resDrivers.forEach(d => driverMap[String(d.driver_number)] = d.name_acronym);

            const podium = resRes
                .sort((a, b) => a.position - b.position)
                .map(r => `${r.position}${driverMap[String(r.driver_number)] || "???"}`)
                .join(' ');

            let circuitName = session.circuit_short_name;
            if (circuitName === 'Spa-Francorchamps') circuitName = 'Spa';
            if (circuitName === 'Interlagos') circuitName = 'Brazil';

            const item = {
                row1: podium,
                row2: `${circuitName} ${session.session_name.substring(0, 7)}`,
                sport: 'F1'
            };

            this.f1Cache.set(cacheKey, item);
            return item;
        } catch (err) {
            return null;
        }
    }
}

module.exports = OpenF1ApiClient;