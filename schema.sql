--
-- PostgreSQL database dump
--

\restrict 7I46OstVAigELAqsWyFluohmIZce2m5JnTmFiNzHP1PxOoGRNrIwpFamfbMQMBN

-- Dumped from database version 16.14 (Homebrew)
-- Dumped by pg_dump version 16.14 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: destinations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.destinations (
    id integer NOT NULL,
    icao text NOT NULL,
    name text NOT NULL,
    lat real NOT NULL,
    lon real NOT NULL,
    aircraft_type text[] NOT NULL,
    notes text,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: destinations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.destinations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: destinations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.destinations_id_seq OWNED BY public.destinations.id;


--
-- Name: fleet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fleet (
    id integer NOT NULL,
    registration text NOT NULL,
    aircraft_type text NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: fleet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fleet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fleet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fleet_id_seq OWNED BY public.fleet.id;


--
-- Name: flight_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flight_plans (
    id integer NOT NULL,
    pilot_uid text NOT NULL,
    departure_icao text NOT NULL,
    arrival_icao text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    fleet_id integer,
    dispatched_at timestamp with time zone,
    callsign text,
    flight_number text,
    simbrief_ofp jsonb,
    dispatch_params jsonb
);


--
-- Name: flight_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.flight_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: flight_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.flight_plans_id_seq OWNED BY public.flight_plans.id;


--
-- Name: flights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flights (
    id integer NOT NULL,
    pilot_uid text NOT NULL,
    departure_icao text,
    arrival_icao text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    distance_nm real DEFAULT 0 NOT NULL,
    last_lat real,
    last_lon real,
    last_alt_agl real,
    landing_rate_fpm real,
    flight_plan_id integer,
    last_ping_at timestamp with time zone
);


--
-- Name: flights_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.flights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: flights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.flights_id_seq OWNED BY public.flights.id;


--
-- Name: pilot_countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pilot_countries (
    pilot_uid text NOT NULL,
    country_code text NOT NULL
);


--
-- Name: pilots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pilots (
    firebase_uid text NOT NULL,
    first_name text,
    last_name text,
    callsign text,
    pfp_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    current_location_icao text DEFAULT 'ELLX'::text NOT NULL,
    simbrief_userid text,
    distance_unit text DEFAULT 'nm'::text NOT NULL,
    email_notifications boolean DEFAULT true NOT NULL
);


--
-- Name: destinations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinations ALTER COLUMN id SET DEFAULT nextval('public.destinations_id_seq'::regclass);


--
-- Name: fleet id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet ALTER COLUMN id SET DEFAULT nextval('public.fleet_id_seq'::regclass);


--
-- Name: flight_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flight_plans ALTER COLUMN id SET DEFAULT nextval('public.flight_plans_id_seq'::regclass);


--
-- Name: flights id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flights ALTER COLUMN id SET DEFAULT nextval('public.flights_id_seq'::regclass);


--
-- Name: destinations destinations_icao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinations
    ADD CONSTRAINT destinations_icao_key UNIQUE (icao);


--
-- Name: destinations destinations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.destinations
    ADD CONSTRAINT destinations_pkey PRIMARY KEY (id);


--
-- Name: fleet fleet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet
    ADD CONSTRAINT fleet_pkey PRIMARY KEY (id);


--
-- Name: fleet fleet_registration_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet
    ADD CONSTRAINT fleet_registration_key UNIQUE (registration);


--
-- Name: flight_plans flight_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flight_plans
    ADD CONSTRAINT flight_plans_pkey PRIMARY KEY (id);


--
-- Name: flights flights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flights
    ADD CONSTRAINT flights_pkey PRIMARY KEY (id);


--
-- Name: pilot_countries pilot_countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pilot_countries
    ADD CONSTRAINT pilot_countries_pkey PRIMARY KEY (pilot_uid, country_code);


--
-- Name: pilots pilots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pilots
    ADD CONSTRAINT pilots_pkey PRIMARY KEY (firebase_uid);


--
-- Name: flight_plans flight_plans_fleet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flight_plans
    ADD CONSTRAINT flight_plans_fleet_id_fkey FOREIGN KEY (fleet_id) REFERENCES public.fleet(id);


--
-- Name: flight_plans flight_plans_pilot_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flight_plans
    ADD CONSTRAINT flight_plans_pilot_uid_fkey FOREIGN KEY (pilot_uid) REFERENCES public.pilots(firebase_uid);


--
-- Name: flights flights_flight_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flights
    ADD CONSTRAINT flights_flight_plan_id_fkey FOREIGN KEY (flight_plan_id) REFERENCES public.flight_plans(id);


--
-- Name: flights flights_pilot_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flights
    ADD CONSTRAINT flights_pilot_uid_fkey FOREIGN KEY (pilot_uid) REFERENCES public.pilots(firebase_uid);


--
-- Name: pilot_countries pilot_countries_pilot_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pilot_countries
    ADD CONSTRAINT pilot_countries_pilot_uid_fkey FOREIGN KEY (pilot_uid) REFERENCES public.pilots(firebase_uid);


--
-- PostgreSQL database dump complete
--

\unrestrict 7I46OstVAigELAqsWyFluohmIZce2m5JnTmFiNzHP1PxOoGRNrIwpFamfbMQMBN

