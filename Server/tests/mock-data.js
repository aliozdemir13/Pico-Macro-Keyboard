const mockResponseNBA = {
    events: [
        {
            id: '401871334',
            date: '2026-05-07T23:00Z',
            name: 'Cleveland Cavaliers at Detroit Pistons',
            shortName: 'CLE @ DET',
            status: { 
                type: { 
                    shortDetail: 'Final' 
                } 
            },
            competitions: [
            {
                competitors: [
                { team: { abbreviation: 'CLE' }, score: '107' },
                { team: { abbreviation: 'DET' }, score: '97' }
                ]
            }
            ]
        },
        {
            id: '401871327',
            date: '2026-05-08T01:30Z',
            name: 'Los Angeles Lakers at Oklahoma City Thunder',
            shortName: 'LAL @ OKC',
            status: { 
                type: { 
                    shortDetail: '10:30 PM'
                } 
            },
            competitions: [
            {
                competitors: [
                { team: { abbreviation: 'LAL' }, score: '125' },
                { team: { abbreviation: 'OKC' }, score: '98' }
                ]
            }
            ]
        }
    ]
};

const mockUclData = {
    events: [
        {
            id: '401862895',
            uid: 's:600~l:775~e:401862895',
            date: '2026-05-06T19:00Z',
            name: 'Paris Saint-Germain at Bayern Munich',
            shortName: 'PSG @ MUN',
            // 1. Status must be at this level
            status: {
            type: {
                shortDetail: 'FT' // Final Time
            }
            },
            // 2. Expand the competitions array
            competitions: [
            {
                competitors: [
                {
                    team: { abbreviation: 'PSG' },
                    score: '2'
                },
                {
                    team: { abbreviation: 'MUN' },
                    score: '1'
                }
                ]
            }
            ]
        },
        {
            id: '401862896',
            date: '2026-05-06T21:00Z',
            name: 'Real Madrid at Manchester City',
            shortName: 'RMD @ MCI',
            status: {
            type: {
                shortDetail: 'Scheduled' // This triggers your formatToLocal logic
            }
            },
            competitions: [
            {
                competitors: [
                {
                    team: { abbreviation: 'RMD' },
                    score: '0'
                },
                {
                    team: { abbreviation: 'MCI' },
                    score: '0'
                }
                ]
            }
            ]
        }
        ]
    };

const mockNflData = {
    events:[
    {
        id: '401772988',
        date: '2026-02-08T23:30Z',
        name: 'Seattle Seahawks at New England Patriots',
        shortName: 'SEA VS NE',
        // Logic: item.status.type.shortDetail
        status: {
        type: {
            shortDetail: 'Final/OT'
        }
        },
        // Logic: item.competitions[0].competitors[0/1]
        competitions: [
        {
            competitors: [
            {
                team: { abbreviation: 'SEA' },
                score: '24'
            },
            {
                team: { abbreviation: 'NE' },
                score: '21'
            }
            ]
        }
        ]
    },
    {
        id: '401772999',
        date: '2026-02-15T18:00Z',
        name: 'Kansas City Chiefs at Las Vegas Raiders',
        shortName: 'KC @ LV',
        status: {
        type: {
            shortDetail: 'Scheduled' // This will trigger your date formatter
        }
        },
        competitions: [
        {
            competitors: [
            {
                team: { abbreviation: 'KC' },
                score: '0'
            },
            {
                team: { abbreviation: 'LV' },
                score: '0'
            }
            ]
        }
        ]
    }
    ]
};

const mockNascarData = {
    events: [
        {
            id: '202602150001',
            shortName: 'Daytona 500', 
            competitions: [
            {
                competitors: [
                {
                    athlete: { shortName: 'Byron' }
                }
                ]
            }
            ]
        },
        {
            id: '202602220025',
            shortName: 'NASCAR Cup Series at Atlanta',
            competitions: [
            {
                competitors: [
                {
                    athlete: { shortName: 'Suarez' }
                }
                ]
            }
            ]
        }
        ]
};

const mockUelData = {
    events: [
    {
        id: '401862895',
        uid: 's:600~l:775~e:401862895',
        date: '2026-05-07T19:00Z',
        name: 'Aston Villa at Nottingham Forest',
        shortName: 'AVL @ NFO',
        // 1. Status must be at this level
        status: {
        type: {
            shortDetail: 'FT' // Final Time
        }
        },
        // 2. Expand the competitions array
        competitions: [
        {
            competitors: [
            {
                team: { abbreviation: 'AVL' },
                score: '2'
            },
            {
                team: { abbreviation: 'NFO' },
                score: '1'
            }
            ]
        }
        ]
    }]
};

const mockSessions = [
    {
        session_key: 9500,
        date_start: "2024-03-02T15:00:00Z",
        circuit_short_name: "Sakhir",
        session_name: "Race"
    },
    {
        session_key: 9505,
        date_start: "2024-07-28T13:00:00Z",
        circuit_short_name: "Spa-Francorchamps",
        session_name: "Grand Prix"
    },
    {
        session_key: 9520,
        date_start: "2024-11-03T17:00:00Z",
        circuit_short_name: "Interlagos",
        session_name: "Race"
    }
];

const mockSessionResults = [
    { position: 1, driver_number: 1, session_key: 9500 },
    { position: 2, driver_number: 11, session_key: 9500 },
    { position: 3, driver_number: 14, session_key: 9500 }
];

const mockDrivers = [
    { driver_number: 1, name_acronym: "VER", team_name: "Red Bull Racing" },
    { driver_number: 11, name_acronym: "PER", team_name: "Red Bull Racing" },
    { driver_number: 14, name_acronym: "ALO", team_name: "Aston Martin" },
    { driver_number: 44, name_acronym: "HAM", team_name: "Mercedes" }
];

module.exports = { mockResponseNBA, mockUclData, mockNflData, mockNascarData, mockUelData, mockSessions, mockSessionResults, mockDrivers };