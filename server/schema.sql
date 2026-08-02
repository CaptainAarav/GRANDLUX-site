CREATE TABLE pilots (
    firebase_uid TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    callsign TEXT,
    pfp_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE flight_plans (
    id SERIAL PRIMARY KEY,
    pilot_uid TEXT NOT NULL REFERENCES pilots(firebase_uid),
    departure_icao TEXT NOT NULL,
    arrival_icao TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    pilot_uid TEXT NOT NULL REFERENCES pilots(firebase_uid),
    departure_icao TEXT,
    arrival_icao TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    distance_nm REAL NOT NULL DEFAULT 0,
    last_lat REAL,
    last_lon REAL,
    last_alt_agl REAL,
    landing_rate_fpm REAL,
    flight_plan_id INTEGER REFERENCES flight_plans(id)
);

CREATE TABLE pilot_countries (
    pilot_uid TEXT NOT NULL REFERENCES pilots(firebase_uid),
    country_code TEXT NOT NULL,
    PRIMARY KEY (pilot_uid, country_code)
);

CREATE TABLE destinations (
    id SERIAL PRIMARY KEY,
    icao TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    aircraft_type TEXT NOT NULL,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE fleet (
    id SERIAL PRIMARY KEY,
    registration TEXT NOT NULL UNIQUE,
    aircraft_type TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE flight_plans ADD COLUMN IF NOT EXISTS fleet_id INTEGER REFERENCES fleet(id);

INSERT INTO destinations (icao, name, lat, lon, aircraft_type, notes) VALUES
('OMDB', 'Dubai International', 25.2532, 55.3657, 'A21N LR', NULL),
('LROP', 'Bucharest Otopeni', 44.5711, 26.0850, 'A320', NULL),
('LRBV', 'Brasov-Ghimbav', 45.7017, 25.5200, 'A320', NULL),
('LSZH', 'Zurich', 47.4647, 8.5492, 'A32N', NULL),
('EPRZ', 'Rzeszow-Jasionka', 50.1100, 22.0189, 'A320', NULL),
('EGLL', 'London Heathrow', 51.4700, -0.4543, 'A21N NEO', NULL),
('LEPA', 'Palma de Mallorca', 39.5517, 2.7388, 'A320', NULL),
('EPWA', 'Warsaw Chopin', 52.1657, 20.9671, 'A320', NULL),
('LEBL', 'Barcelona El Prat', 41.2971, 2.0785, 'A320', NULL),
('LXGB', 'Gibraltar', 36.1511, -5.3497, 'A320', NULL),
('ENBR', 'Bergen Flesland', 60.2934, 5.2181, 'A320', NULL),
('LPMA', 'Madeira', 32.6942, -16.7780, 'A21N LR', 'Special T/R req.');

INSERT INTO fleet (registration, aircraft_type) VALUES
('LX-GRA', 'A21N LR'),
('LX-GRB', 'A21N LR'),
('LX-GRC', 'A320'),
('LX-GRD', 'A320'),
('LX-GRE', 'A320'),
('LX-GRF', 'A32N'),
('LX-GRG', 'A32N'),
('LX-GRH', 'A21N NEO'),
('LX-GRI', 'A21N NEO');
