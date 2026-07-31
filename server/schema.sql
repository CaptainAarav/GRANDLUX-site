CREATE TABLE pilots (
    firebase_uid TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    callsign TEXT,
    pfp_url TEXT,
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
    landing_rate_fpm REAL
);

CREATE TABLE pilot_countries (
    pilot_uid TEXT NOT NULL REFERENCES pilots(firebase_uid),
    country_code TEXT NOT NULL,
    PRIMARY KEY (pilot_uid, country_code)
);
