export const mapConfig = {
    globeTarget: {
        lat: 43.6045,
        lng: 1.4440
    }
};

export const mapView = {
    west: 1.38,
    east: 1.49,
    south: 43.55,
    north: 43.64,
    padding: 80
};

export const lines = [
    {
        id: "A",
        name: "Ligne A",
        color: "#ff3b6a",
        stations: [
            { id: "basso_cambo",           name: "Basso Cambo",           coordinates: [1.3936, 43.5714] },
            { id: "bellefontaine",          name: "Bellefontaine",          coordinates: [1.3990, 43.5750] },
            { id: "reynerie",               name: "Reynerie",               coordinates: [1.4050, 43.5790] },
            { id: "mirail_universite",      name: "Mirail-Université",      coordinates: [1.4090, 43.5820] },
            { id: "bagatelle",              name: "Bagatelle",              coordinates: [1.4130, 43.5850] },
            { id: "mermoz",                 name: "Mermoz",                 coordinates: [1.4150, 43.5880] },
            { id: "fontaine_lestang",       name: "Fontaine Lestang",       coordinates: [1.4160, 43.5910] },
            { id: "arenes",                 name: "Arènes",                 coordinates: [1.4173, 43.5936] },
            { id: "patte_d_oie",            name: "Patte d'Oie",            coordinates: [1.4250, 43.5960] },
            { id: "st_cyprien",             name: "St Cyprien République",  coordinates: [1.4317, 43.5968] },
            { id: "esquirol",               name: "Esquirol",               coordinates: [1.4439, 43.6006] },
            { id: "capitole",               name: "Capitole",               coordinates: [1.4448, 43.6043] },
            { id: "jean_jaures",            name: "Jean Jaurès",            coordinates: [1.448711, 43.605745] },
            { id: "marengo_sncf",           name: "Marengo SNCF",           coordinates: [1.4550, 43.6090] },
            { id: "jolimont",               name: "Jolimont",               coordinates: [1.4600, 43.6120] },
            { id: "roseraie",               name: "Roseraie",               coordinates: [1.4660, 43.6160] },
            { id: "argoulets",              name: "Argoulets",              coordinates: [1.4720, 43.6210] },
            { id: "balma_gramont",          name: "Balma-Gramont",          coordinates: [1.4820, 43.6260] }
        ]
    },
    {
        id: "B",
        name: "Ligne B",
        color: "#ffd056",
        stations: [
            { id: "borderouge",             name: "Borderouge",             coordinates: [1.452383, 43.640934] },
            { id: "trois_cocus",            name: "Trois Cocus",            coordinates: [1.444087, 43.638306] },
            { id: "la_vache",               name: "La Vache",               coordinates: [1.434950, 43.633735] },
            { id: "barriere_de_paris",      name: "Barrière de Paris",      coordinates: [1.433822, 43.626868] },
            { id: "minimes",                name: "Minimes - Cl. Nougaro",  coordinates: [1.435863, 43.620521] },
            { id: "canal_du_midi",          name: "Canal du Midi",          coordinates: [1.433723, 43.615346] },
            { id: "compans_caffarelli",     name: "Compans Caffarelli",     coordinates: [1.435632, 43.610664] },
            { id: "jeanne_d_arc",           name: "Jeanne d'Arc",           coordinates: [1.445751, 43.608565] },
            { id: "jean_jaures",            name: "Jean Jaurès",            coordinates: [1.448711, 43.605745] },
            { id: "francois_verdier",       name: "François Verdier",       coordinates: [1.452062, 43.600440] },
            { id: "carmes",                 name: "Carmes",                 coordinates: [1.445409, 43.597868] },
            { id: "palais_de_justice",      name: "Palais de Justice",      coordinates: [1.444510, 43.592195] },
            { id: "st_michel",              name: "St Michel - M. Langer",  coordinates: [1.447232, 43.586047] },
            { id: "empalot",                name: "Empalot",                coordinates: [1.442117, 43.579925] },
            { id: "st_agne",                name: "St Agne SNCF",           coordinates: [1.449813, 43.580290] },
            { id: "saouzelong",             name: "Saouzelong",             coordinates: [1.459411, 43.579531] },
            { id: "rangueil",               name: "Rangueil",               coordinates: [1.461992, 43.574824] },
            { id: "fac_pharmacie",          name: "Faculté de Pharmacie",   coordinates: [1.464502, 43.568046] },
            { id: "universite_paul_sabatier", name: "Université Paul Sabatier", coordinates: [1.462723, 43.560814] },
            { id: "ramonville",             name: "Ramonville",             coordinates: [1.475800, 43.555659] }
        ]
    }
];

export function buildStationIndex() {
    const index = new Map();
    for (const line of lines) {
        for (const station of line.stations) {
            index.set(station.id, { ...station, line: line.id, lineName: line.name, lineColor: line.color });
        }
    }
    return index;
}
