--
-- PostgreSQL database dump
--

\restrict 73shdsjhxork3et0Q6OESqbB8zBbhz76XTVpEcEogF8ceRMSQtbQ7KpRG1arhMC

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

--
-- Data for Name: destinations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (19, 'OMDB', 'Dubai International', 25.2532, 55.3657, '{"A21N LR"}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (20, 'EGLL', 'London Heathrow', 51.47, -0.4543, '{"A21N NEO",B738}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (21, 'LPMA', 'Madeira', 32.6942, -16.778, '{"A21N LR"}', 'Special T/R req.', true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (22, 'LIML', 'Milan Linate', 45.4451, 9.2767, '{"A21N NEO"}', '737-800 status not yet confirmed', true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (23, 'LROP', 'Bucharest Otopeni', 44.5711, 26.085, '{A32N,"A320 CEO"}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (24, 'LRBV', 'Brasov-Ghimbav', 45.7017, 25.52, '{A32N,"A320 CEO"}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (25, 'LSZH', 'Zurich', 47.4647, 8.5492, '{A32N,"A320 CEO"}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (26, 'EPRZ', 'Rzeszow-Jasionka', 50.11, 22.0189, '{A32N,"A320 CEO"}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (27, 'LEPA', 'Palma de Mallorca', 39.5517, 2.7388, '{A32N,"A320 CEO"}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (28, 'LEBL', 'Barcelona El Prat', 41.2971, 2.0785, '{A32N,"A320 CEO"}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (29, 'LXGB', 'Gibraltar', 36.1511, -5.3497, '{A32N,"A320 CEO"}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (30, 'ENBR', 'Bergen Flesland', 60.2934, 5.2181, '{A32N,"A320 CEO"}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (31, 'EPWA', 'Warsaw Chopin', 52.1657, 20.9671, '{A32N,"A320 CEO",B738}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (32, 'LIRF', 'Rome Fiumicino', 41.8003, 12.2389, '{"A21N LR",B738}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (33, 'LGSK', 'Skiathos', 39.1775, 23.5037, '{B738}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (34, 'LEMD', 'Madrid Barajas', 40.4839, -3.568, '{B738}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (35, 'LPPR', 'Porto', 41.2481, -8.6814, '{B738}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (36, 'EKCH', 'Copenhagen Kastrup', 55.618, 12.656, '{B738}', NULL, true);
INSERT INTO public.destinations (id, icao, name, lat, lon, aircraft_type, notes, active) VALUES (37, 'LDSP', 'Split', 43.5389, 16.2981, '{B738}', NULL, true);


--
-- Data for Name: fleet; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (40, 'LX-LUX', 'A320 CEO', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (41, 'LX-LUY', 'A320 CEO', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (42, 'LX-LUU', 'A320 CEO', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (43, 'LX-BAA', 'A32N', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (44, 'LX-BAB', 'A32N', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (45, 'LX-BAC', 'A32N', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (46, 'LX-BAD', 'A32N', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (47, 'LX-BAE', 'A32N', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (48, 'LX-BAF', 'A32N', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (49, 'LX-BBA', 'A21N LR', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (50, 'LX-BBB', 'A21N LR', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (51, 'LX-BBC', 'A21N LR', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (52, 'LX-BBD', 'A21N LR', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (53, 'LX-BCA', 'A21N NEO', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (54, 'LX-BCB', 'A21N NEO', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (55, 'LX-BCC', 'A21N NEO', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (56, 'LX-BFA', 'B738', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (57, 'LX-BFB', 'B738', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (58, 'LX-BFC', 'B738', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (59, 'LX-BFD', 'B738', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (60, 'LX-BFE', 'B738', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (61, 'LX-BFF', 'B738', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (62, 'LX-BFG', 'B738', true);
INSERT INTO public.fleet (id, registration, aircraft_type, active) VALUES (63, 'LX-BFH', 'B738', true);


--
-- Name: destinations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.destinations_id_seq', 37, true);


--
-- Name: fleet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fleet_id_seq', 63, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 73shdsjhxork3et0Q6OESqbB8zBbhz76XTVpEcEogF8ceRMSQtbQ7KpRG1arhMC

