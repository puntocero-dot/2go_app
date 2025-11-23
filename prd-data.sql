--
-- PostgreSQL database dump
--

\restrict GfYKF9wcST5x39pZzn9I5hA9MiikYiOpLXqE9eOKOFq4GkvQseavAnIa3rrAxY4

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
35e324bf-91aa-4353-a8d4-219bbecb308c	da2e628590f2b56ab516881552a63cdc5c04416e6afcefd76d9d841dec9123b2	2025-11-11 15:15:12.26926+00	20251111151511_add_registro_estado_historial	\N	\N	2025-11-11 15:15:11.626571+00	1
d3319fe0-0d81-4142-a4d0-af1259c92490	d528f6677c532f928d87ca7262e1dfc6f77d66e6b48d585b1ec19f22268c7ab0	2025-11-13 04:09:11.340342+00	20251113040910_add_prioridad_orden	\N	\N	2025-11-13 04:09:10.963573+00	1
a0d75b05-218e-4dc5-b693-61f81950cc59	5283a3a15522e0c2abe38dfa038e55a309a12540b66c212a3d541aee2899d02e	2025-11-16 21:03:13.142645+00	20251116210312_add_estado_cancelada	\N	\N	2025-11-16 21:03:12.698051+00	1
7cfb897d-660c-4b9d-b698-52dcae9b6aba	7064b71f6ed83af0e01607c7e958870b89a4ebb81b7769fc27592efe4577c3b3	2025-11-17 00:19:46.946755+00	20251117001946_add_receptor_fields_to_orden	\N	\N	2025-11-17 00:19:46.598511+00	1
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, email, password, nombre, telefono, rol, activo, "createdAt", "updatedAt") FROM stdin;
117eba3c-1044-493e-8659-db059a911325	admin@armados2go.com	$2a$10$RpFNVsZWIQ8RJCjmpmNTHus9QybcC/yJXccyDjSN2jhEV8SSHa9Gq	Administrador	7777-7777	ADMIN	t	2025-11-12 04:29:59.099	2025-11-12 04:29:59.099
c3940e0d-0ac4-4587-8991-8a24031d308f	supervisor@armados2go.com	$2a$10$0aFkPAi9N4kROXdB5u8X7u88koX8C.ULXDONewjhfieqolGoEIFb6	Supervisor Demo	7777-7778	SUPERVISOR	t	2025-11-12 04:30:00.509	2025-11-17 01:23:02.558
20130186-536f-4af0-a096-b40844956bc9	wruballo@armados2go.com	$2a$10$IATnJ3ReBybsvnO9IPkZ1OkiylGuF9EqkE.aFluArHUEA9jJKUKH.	Andre Ruballo	75867852	ARMADOR	t	2025-11-13 19:43:54.009	2025-11-19 02:05:12.789
0a10341f-b1a8-47ee-a541-aba24b5b4181	armdor_prd@armados2go.com	$2a$10$SBqUB7Ys/9nrAe5Xn7ldlOnpS5eGUe8n5RqbLUfvknHhEFG5hQmzW	Fernando Ruballo	75867852	ARMADOR	t	2025-11-20 05:17:49.292	2025-11-20 05:17:49.292
ef7a40e6-348f-455d-bca8-1368a932b626	fruballo@armados2go.com	$2a$10$Oe9XUjiy6jcgOHRD/nVGo.yEqOw/fkD2yKOzLSauDVXW6K9WNxZDm	Fernando Ruballo	75867852	ARMADOR	t	2025-11-14 04:15:48.585	2025-11-20 15:48:56.843
3cdedc27-d106-4558-8101-789c8b95a2cb	armador@armados2go.com	$2a$10$eMxBcGQdgN2zsfMhQ9v2y.WkEjOqnWhnUkarrWAPGgTgEJ1ohkgqC	Armador app	7777-7779	ARMADOR	t	2025-11-12 04:30:01.096	2025-11-22 23:07:51.402
\.


--
-- Data for Name: armadores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.armadores (id, "usuarioId", estado, "fechaContratacion", "preferenciasHorarias", habilidades, "ubicacionActualLat", "ubicacionActualLng", "ultimaActualizacionGPS", "createdAt", "updatedAt") FROM stdin;
b939430f-7310-44fd-acd3-31c69b916fce	20130186-536f-4af0-a096-b40844956bc9	ACTIVO	2025-11-13 19:43:54.422	\N	{"Muebles pequenos"}	\N	\N	\N	2025-11-13 19:43:54.422	2025-11-19 02:05:12.988
595a0862-ed6c-46d3-852f-0be5129cb79c	0a10341f-b1a8-47ee-a541-aba24b5b4181	ACTIVO	2025-11-20 05:17:49.303	\N	{"Muebles grandes"}	13.6934234	-89.1849381	2025-11-22 14:59:32.348	2025-11-20 05:17:49.303	2025-11-22 14:59:32.349
6271858e-e7d5-4de7-b42d-2a054bbe2945	ef7a40e6-348f-455d-bca8-1368a932b626	ACTIVO	2025-11-14 04:15:50.079	\N	{"Muebles grandes"}	13.6934001	-89.1849088	2025-11-22 22:55:48.466	2025-11-14 04:15:50.079	2025-11-22 22:55:48.467
4d1c4c82-98fd-468e-a367-a8522beabb55	3cdedc27-d106-4558-8101-789c8b95a2cb	ACTIVO	2025-11-12 04:30:02.221	\N	{"Muebles grandes","Muebles pequeños"}	13.6934078	-89.1849038	2025-11-22 23:08:36.272	2025-11-12 04:30:02.221	2025-11-22 23:08:36.273
\.


--
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proyectos (id, "nombreComercial", activo, "tipoCliente", "datosFacturacion", "createdAt", "updatedAt") FROM stdin;
7600de91-6c80-4477-9bf9-9d0742897115	Punto Cero	t	CREDITO_FISCAL	{"nit": "06141806891112", "nrc": "234567", "giro": "servicios informaticos", "contacto": {"email": "wruballo@gmail.com", "nombre": "Willbert Ruballo", "telefono": "+503 75867852"}, "direccion": "San Salvador", "razonSocial": "Punto Cero S.A.S. de C.V"}	2025-11-12 05:09:05.228	2025-11-12 05:09:05.228
512ce6fb-a859-4a99-a193-152dcfecc0b8	Diana Lainez	t	CONSUMIDOR_FINAL	{"dui": "041116878", "contacto": {"email": "wruballo@puntocero.dev", "nombre": "Willbert Ruballo", "telefono": "+503 75867852"}, "direccion": "San Salvador", "nombreCompleto": "Willbert Ruballo"}	2025-11-12 05:13:40.781	2025-11-12 05:13:40.781
82f44d1a-8266-4c6c-8f2a-b337fdc5febe	Willbert Ruballo	t	CREDITO_FISCAL	{"nit": "06141806891113", "nrc": "123458", "giro": "servicios informaticos", "contacto": {"email": "wruballo@gmail.com", "nombre": "Willbert Ruballo", "telefono": "+503 75867852"}, "direccion": "San Salvador", "razonSocial": "Logictraking"}	2025-11-12 06:20:13.127	2025-11-12 06:20:13.127
07955327-db23-4014-ac39-a6fb16a2b30e	Rent a Cars	t	CREDITO_FISCAL	{"nit": "06141806891113", "nrc": "123458", "giro": "servicios de armados", "contacto": {"email": "wruballo@puntocero.dev", "nombre": "Willbert Ruballo", "telefono": "+503 75867852"}, "direccion": "San Salvador", "razonSocial": "Logictraking"}	2025-11-13 05:02:34.891	2025-11-13 05:02:34.891
20cb12eb-0238-4645-a46e-772676feacae	Diego Ruballo	t	CONSUMIDOR_FINAL	{"dui": "04111687-0", "contacto": {"email": "wruballo@gmail.com", "nombre": "Willbert Ruballo", "telefono": "+503 75867852"}, "direccion": "San Salvador", "nombreCompleto": "Willbert Ruballo"}	2025-11-13 05:03:17.823	2025-11-13 05:03:17.823
1f9afc2a-2ec1-4322-a8e9-65c8bd5f0873	Comida W&NTN	t	CREDITO_FISCAL	{"nit": "06141806891114", "nrc": "345678", "giro": "Restaurantes", "contacto": {"email": "wruballo@gmail.com", "nombre": "WR", "telefono": "75867852"}, "direccion": "Col. El Carmen, Pasaje Loma Linda", "razonSocial": "Comida W&NTN sa de cv"}	2025-11-20 05:38:28.506	2025-11-20 05:38:28.506
\.


--
-- Data for Name: muebles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.muebles (id, nombre, tamano, descripcion, "proyectoId", "createdAt", "updatedAt") FROM stdin;
793c803f-77cc-48f2-9b1c-b3f569a84be5	Cuba	MEDIANO	SKU: 132456	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-12 05:10:00.856	2025-11-12 05:10:00.856
af31645b-eb38-45aa-be7e-13c5abe1ec11	Panama	GRANDE	SKU: q23456	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-12 05:18:10.125	2025-11-12 05:18:10.125
d5f00d04-2925-4f96-9580-aadba69ad983	sofacama	PEQUENO	SKU: 345678	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-13 04:30:32.979	2025-11-13 04:30:32.979
9d6240d2-2a58-42bc-936b-32a5b3b5e950	Ropero de 6	GRANDE	SKU: SKU-ARM-003	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:33:23.261	2025-11-13 05:33:23.261
ff6e1367-6e5e-406f-8986-f0a66a803dbd	Mesa de comedor	MEDIANO	SKU: SKU-CENT-003	20cb12eb-0238-4645-a46e-772676feacae	2025-11-13 05:33:36.244	2025-11-13 05:33:36.244
c5a99dbe-e44c-408e-81f9-de089a3d575d	Cama Queen	GRANDE	SKU: SKU-CENT-004	20cb12eb-0238-4645-a46e-772676feacae	2025-11-13 05:33:38.27	2025-11-13 05:33:38.27
fe22c872-4ca3-44bd-b292-bdb91c6d32b0	Sof� Seccional	GRANDE	SKU: SKU-CENT-006	20cb12eb-0238-4645-a46e-772676feacae	2025-11-13 05:33:39.535	2025-11-13 05:33:39.535
6c0c91b4-6804-4a3a-a0d4-d9e284ee684b	Escritorio	MEDIANO	SKU: SKU-CENT-007	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:33:42.499	2025-11-13 05:33:42.499
bdfdb470-41ae-464b-83b9-2bbcc01788d4	Vitrina de cristal	GRANDE	SKU: SKU-CENT-009	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:33:45.374	2025-11-13 05:33:45.374
975a54bb-3547-4108-bfbd-724c974f9c16	Zapatera	MEDIANO	SKU: SKU-CENT-010	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:33:46.993	2025-11-13 05:33:46.993
9295da94-ff31-4cca-9d02-2c740e975876	Mueble para TV	GRANDE	SKU: SKU-CENT-011	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:33:48.882	2025-11-13 05:33:48.882
d08c0b55-c64a-48c6-aeb2-05c77d45aa9e	Sill�n reclinable	MEDIANO	SKU: SKU-CENT-013	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:33:50.111	2025-11-13 05:33:50.111
a8f74693-6803-412b-a378-3d78f0843220	Estante alto	GRANDE	SKU: SKU-CENT-014	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:33:51.937	2025-11-13 05:33:51.937
eaee0141-ffd7-4eee-b266-8a52ff542df0	Cuna para beb�	MEDIANO	SKU: SKU-CENT-015	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:33:54.688	2025-11-13 05:33:54.688
07b0bea0-c65f-460d-8ef8-e75c8ab4a2c7	Tocador	GRANDE	SKU: SKU-CENT-017	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:33:58.155	2025-11-13 05:33:58.155
ba2947e8-0869-43c0-bd3e-136b0b5ac8d1	Rack de cocina	MEDIANO	SKU: SKU-CENT-018	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:33:59.266	2025-11-13 05:33:59.266
5f23a01f-d113-43a2-89b4-bb27f5ece731	Sof� de 3 asient.	GRANDE	SKU: SKU-CENT-020	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:34:01.698	2025-11-13 05:34:01.698
20e94ad9-8251-4932-9ce2-4134c0ac5cc6	Mesa de centro	MEDIANO	SKU: SKU-CENT-021	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:34:04.187	2025-11-13 05:34:04.187
0d11bcb9-0512-4e5d-8397-ad7bcff776a1	Ropero 6 puertas	GRANDE	SKU: SKU-123456	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-16 21:26:49.23	2025-11-16 21:26:49.23
39dfc6c4-fbad-49db-a669-91392ca8a349	Sofa cama	GRANDE	SKU: 234567	1f9afc2a-2ec1-4322-a8e9-65c8bd5f0873	2025-11-20 05:53:20.056	2025-11-20 05:53:20.056
094e097e-7f9f-4b18-b272-ab107b7e30ca	Uevke	MEDIANO	SKU: Qwerty	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-20 14:01:13.364	2025-11-20 14:01:13.364
afdac737-2b6c-496d-962c-1221b155febd	Estanter�a	PEQUENO	SKU: SKU-CENT-005	20cb12eb-0238-4645-a46e-772676feacae	2025-11-20 15:47:20.664	2025-11-20 15:47:20.664
449a6adc-8bcb-4123-a2f4-1bc033f85922	Silla de oficina	PEQUENO	SKU: SKU-CENT-008	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-20 15:47:20.948	2025-11-20 15:47:20.948
52d3491a-dee7-4732-b4b1-c5a17106c28d	Espejo de pared	PEQUENO	SKU: SKU-CENT-012	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-20 15:47:21.284	2025-11-20 15:47:21.284
9f9b5001-3a0f-41ea-b868-b0c846113de3	Mesa auxiliar	PEQUENO	SKU: SKU-CENT-016	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-20 15:47:21.593	2025-11-20 15:47:21.593
d51a152b-e887-49a7-8bf9-01feccb3f0bb	Zapatera de metal	PEQUENO	SKU: SKU-CENT-019	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-20 15:47:21.851	2025-11-20 15:47:21.851
\.


--
-- Data for Name: usuarios_finales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios_finales (id, nombre, telefono, email, "direccionCompleta", municipio, departamento, "coordenadasLat", "coordenadasLng", prioridad, "proyectoId", "createdAt", "updatedAt") FROM stdin;
faec3411-11b4-4776-95a9-03c0d30804d8	Diana L	75867852	admin@armados2go.com	San Salvador	Usulutan	Usulutan	\N	\N	NORMAL	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-12 05:10:01.426	2025-11-12 05:10:01.426
91ebb466-5205-4791-9aee-bff6b4b1ef06	Santiago	75867852	admin@armados2go.com	San Salvador	Usulutan	Usulutan	\N	\N	NORMAL	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-12 05:18:10.386	2025-11-12 05:18:10.386
47c75f9b-fcaf-4f36-a3d4-18392f796ba8	Santiago	75867852	wruballo@gmail.com	San Salvador	San Miguel	San Miguel	\N	\N	NORMAL	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-13 04:14:06.271	2025-11-13 04:14:06.271
2647ca81-fc2a-4a6c-af20-3367e3866557	Abigail	75867852	wruballo@outlook.com	San Salvador	Soyapango	San Salvador	\N	\N	NORMAL	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-13 04:30:34.286	2025-11-13 04:30:34.286
37d6d3b8-1b53-4f33-8dee-7eb4e08bcf43	Mario Castro	70003333	dlainez2201@gmail.com	Col. San Francisco, Av. Sur, Casa #5	San Miguel	San Miguel	\N	\N	NORMAL	20cb12eb-0238-4645-a46e-772676feacae	2025-11-13 05:33:39.064	2025-11-13 05:33:39.064
7c901c63-611a-40cc-9649-89be0de8ef05	Laura Pineda	65432109	wruballo@outlook.com	Bario El Calvario, Cll. Ppal. #10	Chalatenango	Chalatenango	\N	\N	NORMAL	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:33:40.282	2025-11-13 05:33:40.282
ac13423d-7f2d-424f-9f98-804705e2a0fd	Anonimo 1000	75867852	wruballo@gmal.com	Col. El Carmen, Pasaje Loma Linda	La Union	La Union	\N	\N	VIP	1f9afc2a-2ec1-4322-a8e9-65c8bd5f0873	2025-11-20 05:53:20.186	2025-11-20 05:53:20.186
66850992-6202-47ee-8985-5a005c3f3545	Isai Rub	75867852	wruballo@gmail.com	7 Ave Sur, Calle Colon, #1bis Ciudad Delgado	Ciudad Delgado	San Salvador	\N	\N	NORMAL	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-20 14:01:13.537	2025-11-20 14:01:13.537
4b38e484-85ff-45a6-8009-53d7aceff03e	Juan P�rez	75867852	wruballo@gmail.com	Col. San Patricio, Cll. Ppal. #12	San Salvador	San Salvador	\N	\N	NORMAL	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:33:17.299	2025-11-20 15:47:20.29
9d908ee4-6a99-4780-8111-afe85f613c0a	Diana Lainez	72226244	dlainez2201@gmail.com	Col. Las Colinas, Blvd. Ppal. Casa #2	La Uni�n	La Uni�n	\N	\N	NORMAL	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:33:26.683	2025-11-20 15:47:20.383
a4d2b3cc-2361-46fa-8557-cec28cbebcb2	Ana G�mez	60123456	wruballo@outlook.com	Urb. Los Girasoles, Pje. 3, Casa #8	Santa Tecla	La Libertad	\N	\N	NORMAL	20cb12eb-0238-4645-a46e-772676feacae	2025-11-13 05:33:35.401	2025-11-20 15:47:20.464
5e7005bc-eb85-4bd1-8392-1207b48ecffd	Luis Mazariego	77889900	admin@armados2go.com	Cant�n El Centro, Finca #23	Sonsonate	Sonsonate	\N	\N	NORMAL	20cb12eb-0238-4645-a46e-772676feacae	2025-11-13 05:33:36.902	2025-11-20 15:47:20.53
8c9a0638-5127-4080-a678-376ae6048db7	Anonimo 5	61112222	wruballo@gmail.com	Residencial Jardines, Pol�gono C, #1	Cojutepeque	Cuscatl�n	\N	\N	NORMAL	20cb12eb-0238-4645-a46e-772676feacae	2025-11-20 15:47:20.614	2025-11-20 15:47:20.614
abd992c0-b4c8-4e9a-be3d-e5a64fda799f	Elena Ramos	68887777	wruballo@gmail.com	Calle Los Pinos, Km 5, Caser�o El Sol	Usulut�n	Usulut�n	\N	\N	NORMAL	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:33:44.817	2025-11-20 15:47:21.033
4615046e-3164-47d2-ad1f-8505faac6dd2	Javier Torres	79998888	dlainez2201@gmail.com	Urb. Nuevo Amanecer, Sector 1, #15	Ahuachap�n	Ahuachap�n	\N	\N	NORMAL	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:33:46.543	2025-11-20 15:47:21.107
4701af66-3b8f-4662-b112-925dc2b17105	Anonimo 19	64449999	wruballo@outlook.com	Condominio Las Nubes, Torre 1, Ap. 202	Nueva San Salvador	La Libertad	\N	\N	NORMAL	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-20 15:47:21.817	2025-11-20 15:47:21.817
6f65b231-4373-4c5e-a6c2-9940bc952537	Carlos Mena	70705050	admin@armados2go.com	Bario San Jos�, Av. Norte, Casa #3	Sensuntepeque	Caba�as	\N	\N	NORMAL	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:34:01.024	2025-11-20 15:47:21.93
\.


--
-- Data for Name: ordenes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ordenes (id, "codigoReferenciaRetail", "muebleId", "usuarioFinalId", "armadorId", "proyectoId", "fechaCreacion", "fechaSolicitadaCliente", "fechaAsignacion", "fechaRuta", "fechaInicioArmado", "fechaFinArmado", "fechaCompletado", estado, "tiempoAcumuladoEstados", "cobroFinal", "desgloseCobro", "linkMagicoToken", "createdAt", "updatedAt", prioridad, "documentoReceptor", "nombreReceptor", "csatPuntaje", "csatComentario", "csatFecha") FROM stdin;
0a669431-5bae-4dd4-9603-e7e6291bec84	ORD-2025-0013455	0d11bcb9-0512-4e5d-8397-ad7bcff776a1	faec3411-11b4-4776-95a9-03c0d30804d8	6271858e-e7d5-4de7-b42d-2a054bbe2945	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-16 21:37:44.897	2025-03-15 06:00:00	2025-11-16 21:37:46.66	2025-11-20 19:05:57.996	2025-11-20 20:30:47.918	\N	2025-11-21 00:23:32.656	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Llamar 30 minutos antes"}	1e50ff77-21c3-4c80-8e83-86067f9affea	2025-11-16 21:37:44.897	2025-11-21 00:23:32.659	NORMAL	0987	Test	\N	\N	\N
ff5a15fa-af09-4ee2-9a26-fa91bb59e300	ORD-2025-002	9d6240d2-2a58-42bc-936b-32a5b3b5e950	9d908ee4-6a99-4780-8111-afe85f613c0a	6271858e-e7d5-4de7-b42d-2a054bbe2945	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:53:55.202	2025-11-18 06:00:00	2025-11-16 21:16:48.5	2025-11-21 00:23:52.657	2025-11-21 00:53:43.687	\N	2025-11-21 01:29:23.245	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Ensamblaje de..."}	d4d6557b-fb97-414a-9b51-b0e658702d40	2025-11-13 05:53:55.202	2025-11-21 01:29:23.248	VIP	098987	Guaga	\N	\N	\N
3b136c04-cd3b-4353-96c4-e183c779d9af	ORD-2025-006	fe22c872-4ca3-44bd-b292-bdb91c6d32b0	37d6d3b8-1b53-4f33-8dee-7eb4e08bcf43	6271858e-e7d5-4de7-b42d-2a054bbe2945	20cb12eb-0238-4645-a46e-772676feacae	2025-11-13 05:53:59.76	2025-11-18 06:00:00	2025-11-16 21:16:47.228	2025-11-21 01:29:42.958	2025-11-21 01:36:05.278	\N	2025-11-21 01:39:26.883	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Montaje de TV"}	aa1c9a4a-cdd4-4b43-8506-520bcab04199	2025-11-13 05:53:59.76	2025-11-21 01:39:26.884	NORMAL	04111	Ruta will	\N	\N	\N
1499a7c5-9f73-41ac-857e-c80b239edaf4	ORD-2025-014	a8f74693-6803-412b-a378-3d78f0843220	4615046e-3164-47d2-ad1f-8505faac6dd2	6271858e-e7d5-4de7-b42d-2a054bbe2945	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:54:09.952	2025-11-18 06:00:00	2025-11-16 20:21:31.306	2025-11-21 01:45:27.76	2025-11-21 03:19:02.502	\N	2025-11-21 15:13:35.501	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Librero modular"}	42f0fe01-334a-4f6e-bc98-68420082fdd6	2025-11-13 05:54:09.952	2025-11-21 15:13:35.504	VIP	Bbbv	Bbbv	\N	\N	\N
a074ef98-1b28-4246-b4fe-9924f605eaff	ORD-2025-017	07b0bea0-c65f-460d-8ef8-e75c8ab4a2c7	4b38e484-85ff-45a6-8009-53d7aceff03e	6271858e-e7d5-4de7-b42d-2a054bbe2945	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:54:14.834	2025-11-18 06:00:00	2025-11-16 19:59:08.348	2025-11-21 04:11:04.789	2025-11-21 04:11:14.451	\N	2025-11-21 15:14:13.756	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Gavetero de 5"}	30d93014-56ff-466b-9da5-b364f151069d	2025-11-13 05:54:14.834	2025-11-21 15:14:13.757	MEDIA	G	Ruta will	\N	\N	\N
57193230-ec3b-4cb1-ba14-1f267ad90102	ORD-2025-018	ba2947e8-0869-43c0-bd3e-136b0b5ac8d1	9d908ee4-6a99-4780-8111-afe85f613c0a	6271858e-e7d5-4de7-b42d-2a054bbe2945	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:54:16.233	2025-11-18 06:00:00	2025-11-16 19:58:11.434	2025-11-21 15:14:30.054	2025-11-21 22:44:31.81	\N	2025-11-21 22:44:58.34	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Mueble de ba�o"}	59e24cbe-096e-475e-aeb8-d5207ec1f504	2025-11-13 05:54:16.233	2025-11-21 22:44:58.341	VIP	098987	Guaga	\N	\N	\N
8186caa2-c4dd-4848-94b1-3b002418f414	ORD-2025-021	20e94ad9-8251-4932-9ce2-4134c0ac5cc6	4b38e484-85ff-45a6-8009-53d7aceff03e	b939430f-7310-44fd-acd3-31c69b916fce	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:54:19.563	2025-11-18 06:00:00	2025-11-16 19:57:20.053	\N	\N	\N	\N	ASIGNADO	\N	\N	{"notasEntrega": "Mesa ratona"}	61b2af8c-8ad0-4336-ba22-42cbb3711625	2025-11-13 05:54:19.563	2025-11-16 19:57:20.067	MEDIA	\N	\N	\N	\N	\N
4b7c9b45-af88-4b7a-90a1-25504a7e4d4a	ORD-2025-020	5f23a01f-d113-43a2-89b4-bb27f5ece731	6f65b231-4373-4c5e-a6c2-9940bc952537	b939430f-7310-44fd-acd3-31c69b916fce	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:54:17.991	2025-11-18 06:00:00	2025-11-16 19:57:47.653	\N	\N	\N	\N	ASIGNADO	\N	\N	{"notasEntrega": "Seccional esquin."}	5312fc67-1c98-4a83-b7fc-d49425f9683a	2025-11-13 05:54:17.991	2025-11-16 19:57:47.665	URGENTE	\N	\N	\N	\N	\N
ed652a45-7fff-4f6d-8e82-22aec4870220	ORD-2025-011	9295da94-ff31-4cca-9d02-2c740e975876	7c901c63-611a-40cc-9649-89be0de8ef05	b939430f-7310-44fd-acd3-31c69b916fce	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:54:07.528	2025-11-18 06:00:00	2025-11-16 21:16:45.614	\N	\N	\N	\N	ASIGNADO	\N	\N	{"notasEntrega": "Base de cama"}	a588700d-037e-4e25-b6e0-71881478a4c1	2025-11-13 05:54:07.528	2025-11-16 21:16:45.616	NORMAL	\N	\N	\N	\N	\N
bdf2e967-4d32-4c1b-9b74-12bb43b6b0fa	ORD-2025-007	6c0c91b4-6804-4a3a-a0d4-d9e284ee684b	7c901c63-611a-40cc-9649-89be0de8ef05	b939430f-7310-44fd-acd3-31c69b916fce	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:54:00.794	2025-11-18 06:00:00	2025-11-16 21:16:46.826	\N	\N	\N	\N	ASIGNADO	\N	\N	{"notasEntrega": "Instalaci�n de persia"}	9a2ba71f-8537-4317-92c8-318674238ee3	2025-11-13 05:54:00.794	2025-11-16 21:16:46.828	NORMAL	\N	\N	\N	\N	\N
3d4b2896-000a-48f8-9238-fbe78dd129e3	ORD-2025-003	ff6e1367-6e5e-406f-8986-f0a66a803dbd	a4d2b3cc-2361-46fa-8557-cec28cbebcb2	b939430f-7310-44fd-acd3-31c69b916fce	20cb12eb-0238-4645-a46e-772676feacae	2025-11-13 05:53:57.205	2025-11-18 06:00:00	2025-11-16 21:16:48.034	\N	\N	\N	\N	ASIGNADO	\N	\N	{"notasEntrega": "Kit de instalaci�n"}	35bb7157-a070-419f-91e0-4ce811e6fb01	2025-11-13 05:53:57.205	2025-11-16 21:16:48.036	MEDIA	\N	\N	\N	\N	\N
f84409fc-02b9-4ca9-b01b-5c572dd9b1ce	p123456	d5f00d04-2925-4f96-9580-aadba69ad983	2647ca81-fc2a-4a6c-af20-3367e3866557	b939430f-7310-44fd-acd3-31c69b916fce	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-13 04:30:35.565	2025-11-14 00:00:00	2025-11-16 21:16:49.323	\N	\N	\N	\N	ASIGNADO	\N	\N	\N	bfbbe637-e913-432c-a1e9-a86d91ffa510	2025-11-13 04:30:35.565	2025-11-16 21:16:49.324	NORMAL	\N	\N	\N	\N	\N
e899ef4a-66fd-458b-b38f-11f218070ae2	432156	793c803f-77cc-48f2-9b1c-b3f569a84be5	faec3411-11b4-4776-95a9-03c0d30804d8	4d1c4c82-98fd-468e-a367-a8522beabb55	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-12 05:10:02.894	2025-11-12 00:00:00	2025-11-12 05:10:26.015	\N	\N	\N	\N	CANCELADA	\N	\N	\N	ee76a0c0-2e6d-4a08-b77f-644eb5fa77c2	2025-11-12 05:10:02.894	2025-11-16 21:40:05.961	NORMAL	\N	\N	\N	\N	\N
37814cc7-97ba-4659-99a8-18826453d953	ORD-2025-013	d08c0b55-c64a-48c6-aeb2-05c77d45aa9e	abd992c0-b4c8-4e9a-be3d-e5a64fda799f	4d1c4c82-98fd-468e-a367-a8522beabb55	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:54:08.752	2025-11-18 06:00:00	2025-11-16 21:16:45.06	2025-11-16 22:20:12.08	2025-11-16 22:20:25.66	2025-11-16 22:20:29.719	2025-11-17 01:23:59.178	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Butaca de sala"}	d5dc44a8-6a30-4bef-94c7-2e2f70c93be2	2025-11-13 05:54:08.752	2025-11-17 01:23:59.181	MEDIA	\N	\N	\N	\N	\N
21bd9931-c917-4d2a-a176-c933633d1336	ORD-2025-001	9d6240d2-2a58-42bc-936b-32a5b3b5e950	4b38e484-85ff-45a6-8009-53d7aceff03e	4d1c4c82-98fd-468e-a367-a8522beabb55	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-13 05:53:52.12	2025-11-18 06:00:00	2025-11-16 21:16:48.912	2025-11-17 01:44:57.381	2025-11-17 01:46:30.9	2025-11-17 01:47:05.837	2025-11-17 02:14:07.019	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Ensamblaje de..."}	d140abc8-5cf1-42c0-89e6-1db130016ba4	2025-11-13 05:53:52.12	2025-11-17 02:14:07.02	URGENTE	\N	Will	\N	\N	\N
c2900077-39a5-4e20-8bab-3d739559f13b	ORD-2025-009	bdfdb470-41ae-464b-83b9-2bbcc01788d4	abd992c0-b4c8-4e9a-be3d-e5a64fda799f	4d1c4c82-98fd-468e-a367-a8522beabb55	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:54:04.182	2025-11-18 06:00:00	2025-11-16 21:16:46.417	2025-11-17 01:46:02.959	2025-11-17 01:47:01.889	2025-11-17 02:13:45.294	2025-11-17 02:14:34.058	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Armario de 4 puer."}	fae67c33-dd68-4233-a2af-cc06ad8ab5fe	2025-11-13 05:54:04.182	2025-11-17 02:14:34.06	MEDIA	8	Test	\N	\N	\N
9a143b89-2a49-41bf-80ff-8c0cb1eedb27	12345670	793c803f-77cc-48f2-9b1c-b3f569a84be5	47c75f9b-fcaf-4f36-a3d4-18392f796ba8	4d1c4c82-98fd-468e-a367-a8522beabb55	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-13 04:14:07.249	2025-11-14 00:00:00	2025-11-13 04:14:36.781	2025-11-18 05:13:25.532	2025-11-18 05:14:07.832	\N	2025-11-18 05:56:07.649	ARMADO_COMPLETADO	\N	\N	\N	89951878-cc52-4085-8190-ac54c83ef46f	2025-11-13 04:14:07.249	2025-11-18 05:56:07.652	NORMAL	8	WIll Test	5	Tdo bien	2025-11-18 05:56:07.649+00
154172b9-955c-42c6-873e-e8c546cb5f97	ORD-2025-015	eaee0141-ffd7-4eee-b266-8a52ff542df0	7c901c63-611a-40cc-9649-89be0de8ef05	b939430f-7310-44fd-acd3-31c69b916fce	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:54:12.341	2025-11-18 06:00:00	2025-11-16 20:08:30.866	2025-11-19 02:06:29.198	2025-11-19 02:07:00.005	\N	2025-11-19 02:08:15.554	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Cambiador de beb�"}	556800d5-5bf0-4e51-89c6-49b5da47c4d4	2025-11-13 05:54:12.341	2025-11-19 02:08:15.56	NORMAL	0	Diana	5	Tdo bien	2025-11-19 02:08:15.554+00
cb96ae75-aade-417c-b081-a2068e3ea7d6	432156	af31645b-eb38-45aa-be7e-13c5abe1ec11	91ebb466-5205-4791-9aee-bff6b4b1ef06	4d1c4c82-98fd-468e-a367-a8522beabb55	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-12 05:18:10.968	2025-11-12 00:00:00	2025-11-12 06:08:14.896	2025-11-20 02:24:12.037	2025-11-20 02:25:07.015	\N	2025-11-20 02:33:49.214	ARMADO_COMPLETADO	\N	\N	\N	2d055e16-57aa-4772-9b21-82a42135abbe	2025-11-12 05:18:10.968	2025-11-20 02:33:49.217	NORMAL	04111687-8	Diana Test	\N	\N	\N
5f5b5e64-eeaf-41cc-b943-601e12330151	ORD-2025-004	c5a99dbe-e44c-408e-81f9-de089a3d575d	5e7005bc-eb85-4bd1-8392-1207b48ecffd	4d1c4c82-98fd-468e-a367-a8522beabb55	20cb12eb-0238-4645-a46e-772676feacae	2025-11-13 05:53:58.555	2025-11-18 06:00:00	2025-11-16 21:16:47.631	2025-11-17 01:28:21.027	2025-11-17 01:28:28.279	2025-11-17 01:28:34.996	2025-11-17 01:28:40.908	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Mueble de cocina"}	92b2fd82-3317-4a6b-acc9-5e528bc4dc1a	2025-11-13 05:53:58.555	2025-11-17 01:28:40.91	URGENTE	\N	\N	\N	\N	\N
71f8b222-881d-4886-80d1-9f37f34f1200	12345678	39dfc6c4-fbad-49db-a669-91392ca8a349	ac13423d-7f2d-424f-9f98-804705e2a0fd	6271858e-e7d5-4de7-b42d-2a054bbe2945	1f9afc2a-2ec1-4322-a8e9-65c8bd5f0873	2025-11-20 05:53:20.35	\N	2025-11-20 13:05:41.405	2025-11-20 15:51:22.542	2025-11-20 16:21:24.182	\N	2025-11-20 19:05:31.184	ARMADO_COMPLETADO	\N	\N	\N	9df38358-b7d7-4ab7-a49f-4861fed42b7e	2025-11-20 05:53:20.35	2025-11-20 19:05:31.187	VIP	04111	Ruta will	\N	\N	\N
b42ab6ac-8b9b-4ecc-8287-a2f02160ac97	123	094e097e-7f9f-4b18-b272-ab107b7e30ca	66850992-6202-47ee-8985-5a005c3f3545	595a0862-ed6c-46d3-852f-0be5129cb79c	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-20 14:01:13.683	\N	2025-11-20 14:01:43.461	2025-11-20 14:02:49.564	2025-11-20 14:12:23.655	\N	2025-11-20 14:29:43.248	ARMADO_COMPLETADO	\N	\N	\N	dd0fa127-71dd-406f-8970-5dcaade922e2	2025-11-20 14:01:13.683	2025-11-20 14:29:43.251	NORMAL	04111	Ruta will	5	Todo bie	2025-11-20 14:29:43.248+00
30c3f9d9-07a5-4681-9eb3-872d32b94998	ORD-2025-010	975a54bb-3547-4108-bfbd-724c974f9c16	4615046e-3164-47d2-ad1f-8505faac6dd2	6271858e-e7d5-4de7-b42d-2a054bbe2945	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-13 05:54:06.444	2025-11-18 06:00:00	2025-11-16 21:16:46.014	2025-11-21 01:37:41.216	2025-11-21 01:44:33.342	\N	2025-11-21 01:44:53.285	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Rack de televisi�n"}	2a967b4d-590f-46c6-a9b2-1711494127c0	2025-11-13 05:54:06.444	2025-11-21 01:44:53.286	VIP	04111	Ruta will	\N	\N	\N
05405754-7010-4e65-898a-ecec3dd39686	2025-107	449a6adc-8bcb-4123-a2f4-1bc033f85922	91ebb466-5205-4791-9aee-bff6b4b1ef06	595a0862-ed6c-46d3-852f-0be5129cb79c	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-20 15:47:20.97	\N	2025-11-20 15:48:10.747	2025-11-21 06:26:17.496	2025-11-21 06:26:48.71	\N	2025-11-21 06:27:23.234	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Soporte de TV"}	dc635110-205e-4654-ac37-3c83668bfafb	2025-11-20 15:47:20.97	2025-11-21 06:27:23.235	NORMAL	0000	test correo	\N	\N	\N
baf52145-f6dc-407b-aefc-21909060f03a	2025-118	d51a152b-e887-49a7-8bf9-01feccb3f0bb	4701af66-3b8f-4662-b112-925dc2b17105	4d1c4c82-98fd-468e-a367-a8522beabb55	07955327-db23-4014-ac39-a6fb16a2b30e	2025-11-20 15:47:21.872	\N	2025-11-20 15:48:10.546	\N	\N	\N	\N	ASIGNADO	\N	\N	{"notasEntrega": "Repisa flotante"}	2b02d191-d8ec-4351-8562-2d992e832c88	2025-11-20 15:47:21.872	2025-11-20 15:48:10.547	NORMAL	\N	\N	\N	\N	\N
b85fbf22-f138-4048-a6f9-2eac314093cd	2025-104	afdac737-2b6c-496d-962c-1221b155febd	8c9a0638-5127-4080-a678-376ae6048db7	4d1c4c82-98fd-468e-a367-a8522beabb55	20cb12eb-0238-4645-a46e-772676feacae	2025-11-20 15:47:20.69	\N	2025-11-20 15:48:10.804	2025-11-21 06:29:21.4	2025-11-21 06:29:58.963	\N	2025-11-21 06:30:20.47	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Set de 3 repisas"}	3f8c82ac-f44f-418e-83ee-17b31d27cf51	2025-11-20 15:47:20.69	2025-11-21 06:30:20.471	NORMAL	0909090909	test	\N	\N	\N
76ff74a9-34ef-4f6e-9aa6-2a4f87913c08	2025-115	9f9b5001-3a0f-41ea-b868-b0c846113de3	faec3411-11b4-4776-95a9-03c0d30804d8	595a0862-ed6c-46d3-852f-0be5129cb79c	7600de91-6c80-4477-9bf9-9d0742897115	2025-11-20 15:47:21.615	\N	2025-11-20 15:48:10.619	2025-11-21 23:19:34.766	2025-11-22 00:20:48.344	\N	2025-11-22 00:50:40.316	ARMADO_COMPLETADO	\N	\N	{"notasEntrega": "Banco de bar"}	948e965e-7acc-45d5-81ae-a56d45e9e807	2025-11-20 15:47:21.615	2025-11-22 00:50:40.319	NORMAL	Hajahs	Bbbv	\N	\N	\N
12d6953a-21cb-4a77-a363-672b2f789bfb	2025-111	52d3491a-dee7-4732-b4b1-c5a17106c28d	91ebb466-5205-4791-9aee-bff6b4b1ef06	4d1c4c82-98fd-468e-a367-a8522beabb55	512ce6fb-a859-4a99-a193-152dcfecc0b8	2025-11-20 15:47:21.308	\N	2025-11-20 15:48:10.682	2025-11-22 23:08:21.243	\N	\N	\N	EN_RUTA	\N	\N	{"notasEntrega": "Perchero de piso"}	9bbea5a3-deeb-47d8-8f0d-96c024f0d4bb	2025-11-20 15:47:21.308	2025-11-22 23:08:21.244	NORMAL	\N	\N	\N	\N	\N
\.


--
-- Data for Name: archivos_ordenes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.archivos_ordenes (id, "ordenId", url, tipo, "fechaSubida", "fechaEliminacionProgramada") FROM stdin;
b89c28a8-b586-40ac-9b04-2002f03473f2	21bd9931-c917-4d2a-a176-c933633d1336	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763345644/2go/ordenes/21bd9931-c917-4d2a-a176-c933633d1336/orden-21bd9931-c917-4d2a-a176-c933633d1336-1763345643.jpg	FOTO	2025-11-17 02:14:06.345	2025-12-17 02:14:06.341
a44d3b68-def5-442d-a74c-8799fe0f3213	c2900077-39a5-4e20-8bab-3d739559f13b	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763345673/2go/ordenes/c2900077-39a5-4e20-8bab-3d739559f13b/orden-c2900077-39a5-4e20-8bab-3d739559f13b-1763345673.png	FOTO	2025-11-17 02:14:33.665	2025-12-17 02:14:33.662
7b2fe5f0-bb27-4e25-8ee9-47d9a8c1fd8b	c2900077-39a5-4e20-8bab-3d739559f13b	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763345671/2go/ordenes/c2900077-39a5-4e20-8bab-3d739559f13b/orden-c2900077-39a5-4e20-8bab-3d739559f13b-1763345671.jpg	FOTO	2025-11-17 02:14:33.664	2025-12-17 02:14:33.662
a841521a-fc93-4097-b5e9-8e8cfb160c76	c2900077-39a5-4e20-8bab-3d739559f13b	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763345672/2go/ordenes/c2900077-39a5-4e20-8bab-3d739559f13b/orden-c2900077-39a5-4e20-8bab-3d739559f13b-1763345672.jpg	FOTO	2025-11-17 02:14:33.665	2025-12-17 02:14:33.662
5b445199-796d-4e15-a40e-1dc8d076e9d3	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763443010/2go/ordenes/9a143b89-2a49-41bf-80ff-8c0cb1eedb27/orden-9a143b89-2a49-41bf-80ff-8c0cb1eedb27-1763443009.webp	FOTO	2025-11-18 05:16:54.017	2025-12-18 05:16:54.008
80434040-1e1a-43ba-9b3e-a3ededcb736c	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763443013/2go/ordenes/9a143b89-2a49-41bf-80ff-8c0cb1eedb27/orden-9a143b89-2a49-41bf-80ff-8c0cb1eedb27-1763443010.png	FOTO	2025-11-18 05:16:54.02	2025-12-18 05:16:54.008
fd966fde-2bc1-450c-a0da-44dc31c66368	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763444040/2go/ordenes/9a143b89-2a49-41bf-80ff-8c0cb1eedb27/orden-9a143b89-2a49-41bf-80ff-8c0cb1eedb27-1763444039.webp	FOTO	2025-11-18 05:34:01.228	2025-12-18 05:34:01.226
a2dbcfd6-eddf-45cc-97f6-1115175f943a	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763444039/2go/ordenes/9a143b89-2a49-41bf-80ff-8c0cb1eedb27/orden-9a143b89-2a49-41bf-80ff-8c0cb1eedb27-1763444037.jpg	FOTO	2025-11-18 05:34:01.228	2025-12-18 05:34:01.226
c91a1552-1d6f-429d-a6de-513d3bb01939	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763444041/2go/ordenes/9a143b89-2a49-41bf-80ff-8c0cb1eedb27/orden-9a143b89-2a49-41bf-80ff-8c0cb1eedb27-1763444039.png	FOTO	2025-11-18 05:34:01.228	2025-12-18 05:34:01.226
0f1c53e7-79c5-4b6f-baf6-f0e6fe8eb69c	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763445361/2go/ordenes/9a143b89-2a49-41bf-80ff-8c0cb1eedb27/orden-9a143b89-2a49-41bf-80ff-8c0cb1eedb27-1763445360.webp	FOTO	2025-11-18 05:56:04.028	2025-12-18 05:56:04.023
dadc9bf0-ec40-4cb1-bfce-0df280d1b0af	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763445360/2go/ordenes/9a143b89-2a49-41bf-80ff-8c0cb1eedb27/orden-9a143b89-2a49-41bf-80ff-8c0cb1eedb27-1763445358.jpg	FOTO	2025-11-18 05:56:04.028	2025-12-18 05:56:04.023
3f999715-8ac0-45e2-a763-618b87f21f61	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763445361/2go/ordenes/9a143b89-2a49-41bf-80ff-8c0cb1eedb27/orden-9a143b89-2a49-41bf-80ff-8c0cb1eedb27-1763445360.png	FOTO	2025-11-18 05:56:04.029	2025-12-18 05:56:04.023
02bde74b-f67c-47e5-b5de-b4b284fa25b9	154172b9-955c-42c6-873e-e8c546cb5f97	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763518086/2go/ordenes/154172b9-955c-42c6-873e-e8c546cb5f97/orden-154172b9-955c-42c6-873e-e8c546cb5f97-1763518084.webp	FOTO	2025-11-19 02:08:14.013	2025-12-19 02:08:14.007
dca61cb2-aae2-4a8b-b5d3-4d552b2b735c	154172b9-955c-42c6-873e-e8c546cb5f97	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763518091/2go/ordenes/154172b9-955c-42c6-873e-e8c546cb5f97/orden-154172b9-955c-42c6-873e-e8c546cb5f97-1763518089.png	FOTO	2025-11-19 02:08:14.013	2025-12-19 02:08:14.007
90ed2bfa-a02d-4d05-aa9d-c6e57591dfe8	cb96ae75-aade-417c-b081-a2068e3ea7d6	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763606028/2go/ordenes/cb96ae75-aade-417c-b081-a2068e3ea7d6/orden-cb96ae75-aade-417c-b081-a2068e3ea7d6-1763606028.jpg	FOTO	2025-11-20 02:33:49.075	2025-12-20 02:33:49.073
ce307b19-d81d-409a-83ac-4e114e5da6fd	b42ab6ac-8b9b-4ecc-8287-a2f02160ac97	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763648980/2go/ordenes/b42ab6ac-8b9b-4ecc-8287-a2f02160ac97/orden-b42ab6ac-8b9b-4ecc-8287-a2f02160ac97-1763648980.jpg	FOTO	2025-11-20 14:29:43.02	2025-12-20 14:29:43.017
eb35191d-68c7-40c0-b7a1-1b97de5b211b	b42ab6ac-8b9b-4ecc-8287-a2f02160ac97	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763648978/2go/ordenes/b42ab6ac-8b9b-4ecc-8287-a2f02160ac97/orden-b42ab6ac-8b9b-4ecc-8287-a2f02160ac97-1763648976.jpg	FOTO	2025-11-20 14:29:43.02	2025-12-20 14:29:43.017
387d5a28-9862-4100-8862-98f6ff24d67b	b42ab6ac-8b9b-4ecc-8287-a2f02160ac97	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763648982/2go/ordenes/b42ab6ac-8b9b-4ecc-8287-a2f02160ac97/orden-b42ab6ac-8b9b-4ecc-8287-a2f02160ac97-1763648981.jpg	FOTO	2025-11-20 14:29:43.02	2025-12-20 14:29:43.017
61a0d88f-c863-4522-b9e5-e6998739b360	71f8b222-881d-4886-80d1-9f37f34f1200	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763665530/2go/ordenes/71f8b222-881d-4886-80d1-9f37f34f1200/orden-71f8b222-881d-4886-80d1-9f37f34f1200-1763665529.jpg	FOTO	2025-11-20 19:05:30.989	2025-12-20 19:05:30.988
8aa95afa-01e2-4067-8599-1269cd9c0018	0a669431-5bae-4dd4-9603-e7e6291bec84	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763684611/2go/ordenes/0a669431-5bae-4dd4-9603-e7e6291bec84/orden-0a669431-5bae-4dd4-9603-e7e6291bec84-1763684611.jpg	FOTO	2025-11-21 00:23:32.457	2025-12-21 00:23:32.455
1282dd71-81de-430e-a328-17786e41749e	ff5a15fa-af09-4ee2-9a26-fa91bb59e300	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763688562/2go/ordenes/ff5a15fa-af09-4ee2-9a26-fa91bb59e300/orden-ff5a15fa-af09-4ee2-9a26-fa91bb59e300-1763688562.jpg	FOTO	2025-11-21 01:29:23.075	2025-12-21 01:29:23.073
756ec8bb-7b43-4332-bdda-2e747a3b4111	3b136c04-cd3b-4353-96c4-e183c779d9af	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763689166/2go/ordenes/3b136c04-cd3b-4353-96c4-e183c779d9af/orden-3b136c04-cd3b-4353-96c4-e183c779d9af-1763689165.jpg	FOTO	2025-11-21 01:39:26.716	2025-12-21 01:39:26.715
1f3c4c27-f783-48c8-a54d-9dd15ffc812e	30c3f9d9-07a5-4681-9eb3-872d32b94998	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763689492/2go/ordenes/30c3f9d9-07a5-4681-9eb3-872d32b94998/orden-30c3f9d9-07a5-4681-9eb3-872d32b94998-1763689491.jpg	FOTO	2025-11-21 01:44:53.111	2025-12-21 01:44:53.111
8cb89801-5d69-4b69-98b8-8c936f984e18	05405754-7010-4e65-898a-ecec3dd39686	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763706442/2go/ordenes/05405754-7010-4e65-898a-ecec3dd39686/orden-05405754-7010-4e65-898a-ecec3dd39686-1763706442.jpg	FOTO	2025-11-21 06:27:23.033	2025-12-21 06:27:23.032
b522da18-8745-4ba4-aab9-4314fd5939ea	b85fbf22-f138-4048-a6f9-2eac314093cd	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763706619/2go/ordenes/b85fbf22-f138-4048-a6f9-2eac314093cd/orden-b85fbf22-f138-4048-a6f9-2eac314093cd-1763706619.jpg	FOTO	2025-11-21 06:30:20.333	2025-12-21 06:30:20.332
8fb15336-1b92-4800-b343-58c6caa58697	1499a7c5-9f73-41ac-857e-c80b239edaf4	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763738014/2go/ordenes/1499a7c5-9f73-41ac-857e-c80b239edaf4/orden-1499a7c5-9f73-41ac-857e-c80b239edaf4-1763738013.jpg	FOTO	2025-11-21 15:13:35.297	2025-12-21 15:13:35.296
e0c2e68b-894d-41ad-93be-70d6f2b4ac6f	a074ef98-1b28-4246-b4fe-9924f605eaff	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763738052/2go/ordenes/a074ef98-1b28-4246-b4fe-9924f605eaff/orden-a074ef98-1b28-4246-b4fe-9924f605eaff-1763738052.jpg	FOTO	2025-11-21 15:14:13.57	2025-12-21 15:14:13.569
8c4911a1-8c14-4246-a6ce-b2992add3db3	57193230-ec3b-4cb1-ba14-1f267ad90102	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763765097/2go/ordenes/57193230-ec3b-4cb1-ba14-1f267ad90102/orden-57193230-ec3b-4cb1-ba14-1f267ad90102-1763765095.jpg	FOTO	2025-11-21 22:44:58.147	2025-12-21 22:44:58.146
f5a3eacb-334f-464c-96ce-491bb816c9c1	76ff74a9-34ef-4f6e-9aa6-2a4f87913c08	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763772637/2go/ordenes/76ff74a9-34ef-4f6e-9aa6-2a4f87913c08/orden-76ff74a9-34ef-4f6e-9aa6-2a4f87913c08-1763772636.jpg	FOTO	2025-11-22 00:50:40.067	2025-12-22 00:50:40.066
444a75fb-384a-47f7-afbe-2bb81c5c2679	76ff74a9-34ef-4f6e-9aa6-2a4f87913c08	https://res.cloudinary.com/dg6pg9ntg/image/upload/v1763772639/2go/ordenes/76ff74a9-34ef-4f6e-9aa6-2a4f87913c08/orden-76ff74a9-34ef-4f6e-9aa6-2a4f87913c08-1763772638.png	FOTO	2025-11-22 00:50:40.067	2025-12-22 00:50:40.066
\.


--
-- Data for Name: reglas_cobro; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reglas_cobro (id, "proyectoId", "tipoPrincipal", "precioFijoUnitario", "precioVIP", "precioUrgente", "precioMedia", "precioNormal", "precioGrande", "precioMediano", "precioPequeno", "createdAt", "updatedAt") FROM stdin;
44b4b845-6bf0-42e8-9d10-db2131d1b22d	7600de91-6c80-4477-9bf9-9d0742897115	COBRO_POR_VOLUMEN	\N	100	50	20	0	10	-4	-8	2025-11-12 06:15:49.291	2025-11-18 19:13:52.119
59b79a3f-9f5d-494d-b190-2c0556b8b8b2	20cb12eb-0238-4645-a46e-772676feacae	COBRO_FIJO_UNITARIO	30	10	0	0	0	0	0	0	2025-11-13 19:40:31.143	2025-11-20 05:19:19.626
c3914843-9205-45c7-8084-230daeb41622	82f44d1a-8266-4c6c-8f2a-b337fdc5febe	COBRO_FIJO_UNITARIO	28	10	5	2	0	5	0	-4	2025-11-20 05:35:52.445	2025-11-20 05:35:52.445
e0bdba74-cd22-4909-9644-169dd490064c	1f9afc2a-2ec1-4322-a8e9-65c8bd5f0873	COBRO_POR_VOLUMEN	\N	3	2	1	0	3	2	1	2025-11-20 05:42:05.266	2025-11-20 05:42:26.174
323fafcb-7571-472e-8fac-c262e85f5a11	512ce6fb-a859-4a99-a193-152dcfecc0b8	COBRO_POR_VOLUMEN	\N	0	0	0	0	0	0	0	2025-11-12 06:12:50.204	2025-11-21 22:48:41.326
\.


--
-- Data for Name: cobros_distancia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cobros_distancia (id, "reglaCobroId", municipio, precio, "createdAt", "updatedAt") FROM stdin;
a1cdac8f-3de0-4947-acf3-a541a229bc80	44b4b845-6bf0-42e8-9d10-db2131d1b22d	San Salvador	10	2025-11-12 06:15:50.339	2025-11-18 19:13:53.53
cb1a2d14-3dad-4b93-b79a-99743acbcb7f	44b4b845-6bf0-42e8-9d10-db2131d1b22d	San Miguel	10	2025-11-18 19:13:54.25	2025-11-18 19:13:54.25
6fd1d332-7789-40e2-99ff-9dbdd3ba2b0a	59b79a3f-9f5d-494d-b190-2c0556b8b8b2	Sonsonate	10	2025-11-20 05:19:19.637	2025-11-20 05:19:19.637
558eb87d-19c1-4102-b612-404e0e8bda7a	59b79a3f-9f5d-494d-b190-2c0556b8b8b2	Santa Tecla	1	2025-11-20 05:19:19.656	2025-11-20 05:19:19.656
98c77f49-91cb-4c97-8f79-571a7264c429	59b79a3f-9f5d-494d-b190-2c0556b8b8b2	San Miguel	30	2025-11-20 05:19:19.671	2025-11-20 05:19:19.671
e02cd09b-94ef-43db-8a0e-e645f6d60a75	e0bdba74-cd22-4909-9644-169dd490064c	San Salvador	10	2025-11-20 05:42:26.301	2025-11-20 05:42:26.301
\.


--
-- Data for Name: configuracion_sistema; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuracion_sistema (id, clave, valor, descripcion, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: logs_actividad; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.logs_actividad (id, "usuarioId", accion, entidad, "entidadId", detalles, "timestamp") FROM stdin;
019c5ab5-aa29-4c28-8b22-ec52fc0985ba	117eba3c-1044-493e-8659-db059a911325	ASIGNACION_AUTOMATICA	Orden	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	{"score": 76, "generadoEn": "2025-11-13T04:14:34.954Z", "heuristica": "Stub heurístico basado en carga y antigüedad", "alternativas": [], "etaEstimadoMin": 104}	2025-11-13 04:14:37.676
e6880c74-2cd1-4ce3-bd3c-814cc5267eb5	117eba3c-1044-493e-8659-db059a911325	ASIGNACION_AUTOMATICA	Orden	8186caa2-c4dd-4848-94b1-3b002418f414	{"score": 100, "generadoEn": "2025-11-16T19:57:17.485Z", "heuristica": "Stub heurístico basado en carga y antigüedad", "alternativas": [{"score": 100, "armadorId": "6271858e-e7d5-4de7-b42d-2a054bbe2945", "etaEstimadoMin": 100}, {"score": 64, "armadorId": "4d1c4c82-98fd-468e-a367-a8522beabb55", "etaEstimadoMin": 116}], "etaEstimadoMin": 100}	2025-11-16 19:57:21.002
b5c10121-6a49-499d-97ef-ff23e68fce55	117eba3c-1044-493e-8659-db059a911325	ASIGNACION_AUTOMATICA	Orden	57193230-ec3b-4cb1-ba14-1f267ad90102	{"score": 100, "generadoEn": "2025-11-16T19:58:11.280Z", "heuristica": "Stub heurístico basado en carga y antigüedad", "alternativas": [{"score": 76, "armadorId": "b939430f-7310-44fd-acd3-31c69b916fce", "etaEstimadoMin": 104}, {"score": 64, "armadorId": "4d1c4c82-98fd-468e-a367-a8522beabb55", "etaEstimadoMin": 116}], "etaEstimadoMin": 100}	2025-11-16 19:58:11.962
1f90fe76-eff1-474c-b107-79fe20409ba0	117eba3c-1044-493e-8659-db059a911325	ASIGNACION_AUTOMATICA	Orden	a074ef98-1b28-4246-b4fe-9924f605eaff	{"score": 88, "generadoEn": "2025-11-16T19:59:08.246Z", "heuristica": "Stub heurístico basado en carga y antigüedad", "alternativas": [{"score": 76, "armadorId": "b939430f-7310-44fd-acd3-31c69b916fce", "etaEstimadoMin": 104}, {"score": 64, "armadorId": "4d1c4c82-98fd-468e-a367-a8522beabb55", "etaEstimadoMin": 116}], "etaEstimadoMin": 100}	2025-11-16 19:59:09.031
4c5de349-3cc1-42fe-8e14-96dff92e59cb	117eba3c-1044-493e-8659-db059a911325	ASIGNACION_AUTOMATICA	Orden	154172b9-955c-42c6-873e-e8c546cb5f97	{"score": 76, "generadoEn": "2025-11-16T20:08:30.768Z", "heuristica": "Stub heurístico basado en carga y antigüedad", "alternativas": [{"score": 76, "armadorId": "6271858e-e7d5-4de7-b42d-2a054bbe2945", "etaEstimadoMin": 104}, {"score": 64, "armadorId": "4d1c4c82-98fd-468e-a367-a8522beabb55", "etaEstimadoMin": 116}], "etaEstimadoMin": 104}	2025-11-16 20:08:31.746
75be20fd-5829-4f56-954b-b34929ed5c00	117eba3c-1044-493e-8659-db059a911325	ASIGNACION_AUTOMATICA	Orden	1499a7c5-9f73-41ac-857e-c80b239edaf4	{"score": 76, "generadoEn": "2025-11-16T20:21:31.208Z", "heuristica": "Stub heurístico basado en carga y antigüedad", "alternativas": [{"score": 64, "armadorId": "4d1c4c82-98fd-468e-a367-a8522beabb55", "etaEstimadoMin": 116}, {"score": 64, "armadorId": "b939430f-7310-44fd-acd3-31c69b916fce", "etaEstimadoMin": 116}], "etaEstimadoMin": 104}	2025-11-16 20:21:32.219
\.


--
-- Data for Name: penalizaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.penalizaciones (id, "reglaCobroId", tipo, precio, "createdAt", "updatedAt") FROM stdin;
f536b268-18b8-4b86-b268-5de64609dadf	44b4b845-6bf0-42e8-9d10-db2131d1b22d	CLIENTE_NO_CONTESTO	10	2025-11-12 06:15:50.963	2025-11-18 19:13:54.915
f69617df-0635-4769-a9e5-b335aacff881	44b4b845-6bf0-42e8-9d10-db2131d1b22d	PEDIDO_CANCELADO_EN_RUTA	16	2025-11-12 06:15:51.323	2025-11-18 19:13:55.903
22736c8a-f9b2-4524-a899-f3995942888f	59b79a3f-9f5d-494d-b190-2c0556b8b8b2	CLIENTE_NO_CONTESTO	10	2025-11-13 19:40:50.934	2025-11-20 05:19:19.686
7a8a5050-997d-4308-a3a6-bf8be46fd317	59b79a3f-9f5d-494d-b190-2c0556b8b8b2	PEDIDO_CANCELADO_EN_RUTA	0	2025-11-13 19:40:51.744	2025-11-20 05:19:19.707
fd9180dd-f001-4a2b-a5e6-e03e42e62cd9	c3914843-9205-45c7-8084-230daeb41622	CLIENTE_NO_CONTESTO	0	2025-11-20 05:35:52.463	2025-11-20 05:35:52.463
a61afddc-8a04-4852-a897-4bdcd67d4976	c3914843-9205-45c7-8084-230daeb41622	PEDIDO_CANCELADO_EN_RUTA	0	2025-11-20 05:35:52.484	2025-11-20 05:35:52.484
9204bd6a-a373-499e-8ae6-0890e0ea6bed	e0bdba74-cd22-4909-9644-169dd490064c	CLIENTE_NO_CONTESTO	0	2025-11-20 05:42:26.342	2025-11-20 05:42:26.342
6c81e934-2085-4e5e-aad4-b65689aefd41	e0bdba74-cd22-4909-9644-169dd490064c	PEDIDO_CANCELADO_EN_RUTA	0	2025-11-20 05:42:26.368	2025-11-20 05:42:26.368
ed85badf-5d99-4802-801b-fa9186408d1c	323fafcb-7571-472e-8fac-c262e85f5a11	CLIENTE_NO_CONTESTO	0	2025-11-12 06:12:50.38	2025-11-21 22:48:41.416
e6e07ebd-1288-468a-bc19-e675f853cec4	323fafcb-7571-472e-8fac-c262e85f5a11	PEDIDO_CANCELADO_EN_RUTA	0	2025-11-12 06:12:51.566	2025-11-21 22:48:41.437
\.


--
-- Data for Name: penalizaciones_aplicadas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.penalizaciones_aplicadas (id, "ordenId", tipo, monto, "fechaIncidente", descripcion, "createdAt") FROM stdin;
\.


--
-- Data for Name: rangos_volumen; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rangos_volumen (id, "reglaCobroId", desde, hasta, precio, "createdAt") FROM stdin;
53dde360-536a-4d96-a57b-691d3519a714	44b4b845-6bf0-42e8-9d10-db2131d1b22d	1	2	10	2025-11-12 06:15:49.365
042886d5-d7ca-4b52-94d1-7ae53cd40762	44b4b845-6bf0-42e8-9d10-db2131d1b22d	3	4	8	2025-11-12 06:15:49.917
193a057f-d7a8-4990-b1ab-a73d2651ea6f	e0bdba74-cd22-4909-9644-169dd490064c	1	2	29	2025-11-20 05:42:26.21
873ae6a2-608c-4aa2-956a-86785d1bf4ec	e0bdba74-cd22-4909-9644-169dd490064c	3	4	28	2025-11-20 05:42:26.235
60060c06-7da7-4cb2-af7d-aa521178cfbf	e0bdba74-cd22-4909-9644-169dd490064c	5	\N	27	2025-11-20 05:42:26.259
d94f0bc8-65e3-45a0-8975-0dfa6b4a7026	323fafcb-7571-472e-8fac-c262e85f5a11	1	2	100	2025-11-21 22:47:28.417
a2f6625a-42cc-4557-a991-a141862bd9e6	323fafcb-7571-472e-8fac-c262e85f5a11	3	4	200	2025-11-21 22:47:28.442
cd2b9444-530b-4e51-9b8e-4c9af0a6be81	323fafcb-7571-472e-8fac-c262e85f5a11	5	\N	50	2025-11-21 22:47:28.466
\.


--
-- Data for Name: registros_estado; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_estado (id, "ordenId", "estadoAnterior", "estadoNuevo", "estadoCambiadoA", comentario, "usuarioId", "timestamp", latitud, longitud, "etaEstimado") FROM stdin;
c49736db-a67b-47c5-b223-6b8f64c79b3c	e899ef4a-66fd-458b-b38f-11f218070ae2	\N	\N	ASIGNADO	\N	\N	2025-11-12 05:10:27.192	\N	\N	\N
07f72b7d-56cc-4ff5-9683-460ed20799b6	cb96ae75-aade-417c-b081-a2068e3ea7d6	\N	\N	ASIGNADO	\N	\N	2025-11-12 06:08:16.508	\N	\N	\N
bf9936da-3dcf-4e32-9f80-9b6c8d191ade	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	\N	\N	ASIGNADO	\N	\N	2025-11-13 04:14:37.676	\N	\N	2025-11-13 05:58:37.673
529d4e77-c070-4e50-a892-fb2087d6d116	8186caa2-c4dd-4848-94b1-3b002418f414	\N	\N	ASIGNADO	\N	\N	2025-11-16 19:57:21.002	\N	\N	2025-11-16 21:37:20.989
788bf6d6-bb9e-4442-b40b-153c37e4bba9	4b7c9b45-af88-4b7a-90a1-25504a7e4d4a	\N	\N	ASIGNADO	\N	\N	2025-11-16 19:57:48.302	\N	\N	\N
a2284b09-144b-4e19-a684-8447e597a027	57193230-ec3b-4cb1-ba14-1f267ad90102	\N	\N	ASIGNADO	\N	\N	2025-11-16 19:58:11.962	\N	\N	2025-11-16 21:38:11.95
ef3319d7-158d-48b4-bd4e-e6cd083ea9d4	a074ef98-1b28-4246-b4fe-9924f605eaff	\N	\N	ASIGNADO	\N	\N	2025-11-16 19:59:09.031	\N	\N	2025-11-16 21:39:09.03
4dd30060-21d1-40ba-b728-92e54bfef4f9	154172b9-955c-42c6-873e-e8c546cb5f97	\N	\N	ASIGNADO	\N	\N	2025-11-16 20:08:31.745	\N	\N	2025-11-16 21:52:31.744
685ede6a-abeb-4f89-8d81-10676a1e93c5	1499a7c5-9f73-41ac-857e-c80b239edaf4	\N	\N	ASIGNADO	\N	\N	2025-11-16 20:21:32.219	\N	\N	2025-11-16 22:05:32.217
52c1951b-8c7e-42ef-a141-327ff7752a6c	37814cc7-97ba-4659-99a8-18826453d953	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Armador app	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:16:45.212	\N	\N	\N
92af9f2b-7b09-4032-be87-c03923b7dcd2	ed652a45-7fff-4f6d-8e82-22aec4870220	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Andre Ruballo	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:16:45.685	\N	\N	\N
03afd631-0e0d-4d5d-a625-e0573e4ddf14	30c3f9d9-07a5-4681-9eb3-872d32b94998	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Fernando Ruballo	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:16:46.088	\N	\N	\N
002a3078-b889-45f5-a900-e33f4faae7aa	c2900077-39a5-4e20-8bab-3d739559f13b	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Armador app	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:16:46.493	\N	\N	\N
a789b3c9-9696-46f3-a5f2-c08ac030a9ab	bdf2e967-4d32-4c1b-9b74-12bb43b6b0fa	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Andre Ruballo	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:16:46.897	\N	\N	\N
603c7f9b-ce44-4426-83da-3cfe99a811b1	3b136c04-cd3b-4353-96c4-e183c779d9af	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Fernando Ruballo	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:16:47.297	\N	\N	\N
a625c867-e3ee-496e-92c9-9f5e8fc6c857	5f5b5e64-eeaf-41cc-b943-601e12330151	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Armador app	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:16:47.7	\N	\N	\N
bdc30679-459e-456f-b431-01d8a20b3ae9	3d4b2896-000a-48f8-9238-fbe78dd129e3	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Andre Ruballo	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:16:48.17	\N	\N	\N
e9fde287-3132-4ee7-af9d-32540f88ec43	ff5a15fa-af09-4ee2-9a26-fa91bb59e300	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Fernando Ruballo	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:16:48.569	\N	\N	\N
4e65ec53-6ddc-402f-b38c-204709716afc	21bd9931-c917-4d2a-a176-c933633d1336	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Armador app	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:16:48.989	\N	\N	\N
aaabaac3-b758-41fb-b9ee-ba223516e4ce	f84409fc-02b9-4ca9-b01b-5c572dd9b1ce	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Andre Ruballo	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:16:49.393	\N	\N	\N
be92de6e-b606-4bb5-98d5-5bd5f03ba037	0a669431-5bae-4dd4-9603-e7e6291bec84	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Fernando Ruballo	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:37:47.618	\N	\N	\N
09eb6583-84a3-4b4e-9f31-cd767b19e489	e899ef4a-66fd-458b-b38f-11f218070ae2	ASIGNADO	CANCELADA	CANCELADA	Orden cancelada por administrador	117eba3c-1044-493e-8659-db059a911325	2025-11-16 21:40:06.095	\N	\N	\N
05556f3d-ec12-44e5-81cf-ff8ef73c3b73	37814cc7-97ba-4659-99a8-18826453d953	\N	\N	EN_RUTA	\N	\N	2025-11-16 22:20:13.215	\N	\N	\N
b1aaec51-f55b-4cb8-803d-a0d0db811f65	37814cc7-97ba-4659-99a8-18826453d953	\N	\N	ARMADO_INICIADO	\N	\N	2025-11-16 22:20:26.565	\N	\N	\N
f3db8157-b024-436e-a928-f51b237cf151	37814cc7-97ba-4659-99a8-18826453d953	\N	\N	ARMADO_FINALIZADO	\N	\N	2025-11-16 22:20:30.605	\N	\N	\N
7f3b4299-0dfe-4d6a-afea-b12df31a61e6	37814cc7-97ba-4659-99a8-18826453d953	ARMADO_FINALIZADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 01:24:00.136	\N	\N	\N
8b6b9ce2-9d74-4011-b346-9662889bca19	5f5b5e64-eeaf-41cc-b943-601e12330151	ASIGNADO	EN_RUTA	EN_RUTA	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 01:28:21.937	\N	\N	\N
18eca99c-2d68-4266-959d-799fc6fb12f4	5f5b5e64-eeaf-41cc-b943-601e12330151	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 01:28:29.193	\N	\N	\N
07b3702b-a23e-4761-93b3-00c79e009b1f	5f5b5e64-eeaf-41cc-b943-601e12330151	ARMADO_INICIADO	ARMADO_FINALIZADO	ARMADO_FINALIZADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 01:28:35.615	\N	\N	\N
0d011620-66f8-4afa-9b8a-cb76f6e17edc	5f5b5e64-eeaf-41cc-b943-601e12330151	ARMADO_FINALIZADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 01:28:41.823	\N	\N	\N
7d4a2811-d2f3-4f92-9a21-fc39ed55c4e9	21bd9931-c917-4d2a-a176-c933633d1336	ASIGNADO	EN_RUTA	EN_RUTA	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 01:44:58.292	13.6934188	-89.1849105	\N
860b7d1a-31bb-435c-a0f4-9b84ad40d4e3	c2900077-39a5-4e20-8bab-3d739559f13b	ASIGNADO	EN_RUTA	EN_RUTA	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 01:46:03.918	13.6934135	-89.1849162	\N
340d7a5c-1f50-4b25-a350-cc09d3563d7c	21bd9931-c917-4d2a-a176-c933633d1336	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 01:46:31.806	13.6934169	-89.1849114	\N
d63881d3-43ef-4f3d-bd7d-c9ee96c4a7e4	c2900077-39a5-4e20-8bab-3d739559f13b	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 01:47:02.763	13.6934169	-89.1849114	\N
cbcef111-7c78-410b-b53c-67c89a16cb97	21bd9931-c917-4d2a-a176-c933633d1336	ARMADO_INICIADO	ARMADO_FINALIZADO	ARMADO_FINALIZADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 01:47:06.725	13.6934169	-89.1849114	\N
8cde5e56-4afb-41cb-b32a-9ae6cf2b4785	c2900077-39a5-4e20-8bab-3d739559f13b	ARMADO_INICIADO	ARMADO_FINALIZADO	ARMADO_FINALIZADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 02:13:47.961	13.6933941	-89.1849122	\N
c665a17b-86a5-4f19-a46b-6e356410b046	21bd9931-c917-4d2a-a176-c933633d1336	ARMADO_FINALIZADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 02:14:08.457	13.69341	-89.1849154	\N
51825e1d-5b25-4373-b485-5b3cc2fe2e1a	c2900077-39a5-4e20-8bab-3d739559f13b	ARMADO_FINALIZADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-17 02:14:34.648	13.6933953	-89.1849121	\N
2e9a6021-5e37-4a23-b90e-5714f80df6ed	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	ASIGNADO	EN_RUTA	EN_RUTA	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-18 05:13:26.729	13.7344714	-89.2179286	\N
cf384f94-e6ab-4bd2-a265-dbf81b4f6847	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-18 05:14:08.668	13.7344714	-89.2179286	\N
163f8842-f0c3-4ff0-bf0b-c091738d74c3	9a143b89-2a49-41bf-80ff-8c0cb1eedb27	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-18 05:56:08.64	13.6935059	-89.184815	\N
11c2cde9-1843-4526-bb22-1b72989635e1	154172b9-955c-42c6-873e-e8c546cb5f97	ASIGNADO	EN_RUTA	EN_RUTA	\N	20130186-536f-4af0-a096-b40844956bc9	2025-11-19 02:06:30.606	13.7101312	-89.2076032	\N
adea9c56-0555-482a-ad4a-187407316ab3	154172b9-955c-42c6-873e-e8c546cb5f97	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	20130186-536f-4af0-a096-b40844956bc9	2025-11-19 02:07:01.124	13.7101312	-89.2076032	\N
217c67a5-8a49-49b0-8fd3-1d2987eb883a	154172b9-955c-42c6-873e-e8c546cb5f97	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	20130186-536f-4af0-a096-b40844956bc9	2025-11-19 02:08:16.952	13.7008525	-89.2222409	\N
dbd71df0-4f00-4643-8860-c425ce270b6b	cb96ae75-aade-417c-b081-a2068e3ea7d6	ASIGNADO	EN_RUTA	EN_RUTA	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-20 02:24:12.115	13.6933869	-89.1848456	\N
fabde019-68e2-4f60-ab96-e43f01ebc38f	cb96ae75-aade-417c-b081-a2068e3ea7d6	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-20 02:25:07.073	13.6933869	-89.1848456	\N
65eaaa45-f905-4922-a703-b37636f44c16	cb96ae75-aade-417c-b081-a2068e3ea7d6	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-20 02:33:49.268	13.6934037	-89.1849124	\N
de40882d-5057-45df-8569-50ebc61e12aa	71f8b222-881d-4886-80d1-9f37f34f1200	SIN_ASIGNAR	ASIGNADO	ASIGNADO	\N	117eba3c-1044-493e-8659-db059a911325	2025-11-20 13:05:41.454	\N	\N	\N
5b6cedd8-49cc-4b63-a419-8b5793c2a0aa	b42ab6ac-8b9b-4ecc-8287-a2f02160ac97	SIN_ASIGNAR	ASIGNADO	ASIGNADO	\N	117eba3c-1044-493e-8659-db059a911325	2025-11-20 14:01:43.504	\N	\N	\N
b4281df3-5975-4812-990e-bc12611b1ca7	b42ab6ac-8b9b-4ecc-8287-a2f02160ac97	ASIGNADO	EN_RUTA	EN_RUTA	\N	0a10341f-b1a8-47ee-a541-aba24b5b4181	2025-11-20 14:02:49.593	13.6911634	-89.192302	\N
b20654c8-e2e2-4a52-97ec-f67b01bef95e	b42ab6ac-8b9b-4ecc-8287-a2f02160ac97	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	0a10341f-b1a8-47ee-a541-aba24b5b4181	2025-11-20 14:12:23.712	13.6961142	-89.2081533	\N
cd1feb62-d5c2-4d26-8523-127b24393ad9	b42ab6ac-8b9b-4ecc-8287-a2f02160ac97	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	0a10341f-b1a8-47ee-a541-aba24b5b4181	2025-11-20 14:29:43.298	13.702056	-89.2347245	\N
8b9b5e41-d885-4577-9650-b0559c0fc16c	baf52145-f6dc-407b-aefc-21909060f03a	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Armador app	117eba3c-1044-493e-8659-db059a911325	2025-11-20 15:48:10.56	\N	\N	\N
d61172c3-7032-4a96-8657-4fc0d1f9444c	76ff74a9-34ef-4f6e-9aa6-2a4f87913c08	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Fernando Ruballo	117eba3c-1044-493e-8659-db059a911325	2025-11-20 15:48:10.635	\N	\N	\N
f56a6c5e-4cc1-4a03-a4e2-448397ef6052	12d6953a-21cb-4a77-a363-672b2f789bfb	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Armador app	117eba3c-1044-493e-8659-db059a911325	2025-11-20 15:48:10.7	\N	\N	\N
1f5f7170-32a4-4d5f-bcff-df004f95f62b	05405754-7010-4e65-898a-ecec3dd39686	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Fernando Ruballo	117eba3c-1044-493e-8659-db059a911325	2025-11-20 15:48:10.761	\N	\N	\N
acd69bb1-20de-481b-88f9-5a507a3d12af	b85fbf22-f138-4048-a6f9-2eac314093cd	SIN_ASIGNAR	ASIGNADO	ASIGNADO	Auto-asignado a Armador app	117eba3c-1044-493e-8659-db059a911325	2025-11-20 15:48:10.817	\N	\N	\N
a43d4261-fc4e-47e8-a0aa-fcdbc878b7be	71f8b222-881d-4886-80d1-9f37f34f1200	ASIGNADO	EN_RUTA	EN_RUTA	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-20 15:51:22.576	13.703125	-89.240576	\N
9641209c-fcc0-4349-8a8c-13dd247d8ba8	71f8b222-881d-4886-80d1-9f37f34f1200	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-20 16:21:24.25	13.6974938	-89.2505901	\N
126fa651-7481-4b75-b861-b76cdf1698a7	71f8b222-881d-4886-80d1-9f37f34f1200	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-20 19:05:31.232	13.7043808	-89.2544819	\N
baf70f12-1b69-4ef7-a9eb-69807c4d35e5	0a669431-5bae-4dd4-9603-e7e6291bec84	ASIGNADO	EN_RUTA	EN_RUTA	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-20 19:05:58.04	13.7042539	-89.2545354	\N
c7d1a010-36dd-4768-95c0-fc580adb3117	0a669431-5bae-4dd4-9603-e7e6291bec84	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-20 20:30:47.968	13.6974694	-89.2505894	\N
cbbb5bba-1d0c-40db-9142-45311c4c12aa	0a669431-5bae-4dd4-9603-e7e6291bec84	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 00:23:32.705	13.697448	-89.2507215	\N
79ecab0c-a656-411f-bb3d-3729efce88f3	ff5a15fa-af09-4ee2-9a26-fa91bb59e300	ASIGNADO	EN_RUTA	EN_RUTA	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 00:23:52.692	13.6976003	-89.2507687	\N
3806eab5-0ef0-4f3f-ba93-f0bee9f12e3a	ff5a15fa-af09-4ee2-9a26-fa91bb59e300	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 00:53:43.737	13.7008284	-89.222327	\N
a0b4a0de-0bb3-411c-a9fc-bec88271417e	ff5a15fa-af09-4ee2-9a26-fa91bb59e300	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 01:29:23.284	13.7015956	-89.208191	\N
1748b079-8349-4168-8011-3e56c02ad468	3b136c04-cd3b-4353-96c4-e183c779d9af	ASIGNADO	EN_RUTA	EN_RUTA	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 01:29:42.981	13.7025773	-89.207892	\N
6bd7e3e6-9b83-4303-881f-54448a402db6	3b136c04-cd3b-4353-96c4-e183c779d9af	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 01:36:05.328	13.7003673	-89.2211708	\N
1d715df5-fc2c-4182-a4de-2227616d41cc	30c3f9d9-07a5-4681-9eb3-872d32b94998	ASIGNADO	EN_RUTA	EN_RUTA	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 01:37:41.261	13.7002115	-89.2212602	\N
b80f05e4-51c9-469b-a33f-efababb1ceaf	3b136c04-cd3b-4353-96c4-e183c779d9af	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 01:39:26.918	13.7003056	-89.2212643	\N
ae19c015-1d4d-4052-ac01-b2df658cb4d7	30c3f9d9-07a5-4681-9eb3-872d32b94998	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 01:44:33.378	13.7003052	-89.2212309	\N
107a236e-fa54-452e-9962-372e9af9514a	30c3f9d9-07a5-4681-9eb3-872d32b94998	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 01:44:53.327	13.700327	-89.2212458	\N
ce0768db-e072-4a6d-8a0c-e0593af45c19	1499a7c5-9f73-41ac-857e-c80b239edaf4	ASIGNADO	EN_RUTA	EN_RUTA	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 01:45:27.794	13.7003124	-89.221274	\N
4876209a-8106-4d60-9bb0-e78d6837aaf4	1499a7c5-9f73-41ac-857e-c80b239edaf4	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 03:19:02.612	13.6934919	-89.184834	\N
06831429-fc17-431b-8255-6db277184e76	a074ef98-1b28-4246-b4fe-9924f605eaff	ASIGNADO	EN_RUTA	EN_RUTA	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 04:11:04.838	13.6933861	-89.1848751	\N
7b258e98-b023-4d73-b726-85270b5e287a	a074ef98-1b28-4246-b4fe-9924f605eaff	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 04:11:14.487	13.6933983	-89.1847918	\N
c15bad4d-2b2b-4789-b5e0-0356cc024009	05405754-7010-4e65-898a-ecec3dd39686	ASIGNADO	EN_RUTA	EN_RUTA	\N	0a10341f-b1a8-47ee-a541-aba24b5b4181	2025-11-21 06:26:17.545	13.7199616	-89.2305408	\N
88f757a7-7adc-43ad-a6ff-cff72fc1142c	05405754-7010-4e65-898a-ecec3dd39686	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	0a10341f-b1a8-47ee-a541-aba24b5b4181	2025-11-21 06:26:48.747	13.7199616	-89.2305408	\N
4eb76abd-0355-4831-8784-0ee558f417f8	05405754-7010-4e65-898a-ecec3dd39686	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	0a10341f-b1a8-47ee-a541-aba24b5b4181	2025-11-21 06:27:23.27	13.6934029	-89.1848351	\N
f1003afd-822d-4261-9ae8-da1f01447b5a	b85fbf22-f138-4048-a6f9-2eac314093cd	ASIGNADO	EN_RUTA	EN_RUTA	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-21 06:29:21.438	13.6933979	-89.1848288	\N
96de3aa3-6760-4a43-8f51-55602d7ba767	b85fbf22-f138-4048-a6f9-2eac314093cd	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-21 06:29:59.002	13.7199616	-89.2305408	\N
9dac29fe-6cd4-4ef6-b7bf-e29949ec83dc	b85fbf22-f138-4048-a6f9-2eac314093cd	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-21 06:30:20.51	13.69343	-89.1848288	\N
d120a4bc-632a-41c1-ae05-e86cc7c86110	1499a7c5-9f73-41ac-857e-c80b239edaf4	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 15:13:35.552	13.6922825	-89.1988511	\N
a832f377-9a7e-43af-a82c-fdb481b68fdd	a074ef98-1b28-4246-b4fe-9924f605eaff	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 15:14:13.796	13.6928312	-89.202649	\N
9fe5282e-6d96-426c-9162-249c11a22e31	57193230-ec3b-4cb1-ba14-1f267ad90102	ASIGNADO	EN_RUTA	EN_RUTA	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 15:14:30.091	13.6928056	-89.2047327	\N
44f1616d-dd8e-4558-836d-242484c934a3	57193230-ec3b-4cb1-ba14-1f267ad90102	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 22:44:31.858	13.6974705	-89.2506213	\N
5793ed31-5148-46df-aa45-5620a964a9a1	57193230-ec3b-4cb1-ba14-1f267ad90102	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	ef7a40e6-348f-455d-bca8-1368a932b626	2025-11-21 22:44:58.373	13.6974532	-89.2506177	\N
77e1c2cb-d741-4b0c-8851-8e972721eba7	76ff74a9-34ef-4f6e-9aa6-2a4f87913c08	ASIGNADO	EN_RUTA	EN_RUTA	\N	0a10341f-b1a8-47ee-a541-aba24b5b4181	2025-11-21 23:19:34.809	13.6969697	-89.2499516	\N
817effea-a59a-4570-aa2b-0eccfbd970e0	76ff74a9-34ef-4f6e-9aa6-2a4f87913c08	EN_RUTA	ARMADO_INICIADO	ARMADO_INICIADO	\N	0a10341f-b1a8-47ee-a541-aba24b5b4181	2025-11-22 00:20:48.394	13.6933873	-89.1849308	\N
7b0a6f14-d6e3-407d-a5b5-4d9b6375e5bb	76ff74a9-34ef-4f6e-9aa6-2a4f87913c08	ARMADO_INICIADO	ARMADO_COMPLETADO	ARMADO_COMPLETADO	\N	0a10341f-b1a8-47ee-a541-aba24b5b4181	2025-11-22 00:50:40.373	13.6933851	-89.1848443	\N
9584e2b4-240a-43f3-b8d7-cdc3ed896437	12d6953a-21cb-4a77-a363-672b2f789bfb	ASIGNADO	EN_RUTA	EN_RUTA	\N	3cdedc27-d106-4558-8101-789c8b95a2cb	2025-11-22 23:08:21.289	13.6934078	-89.1849038	\N
\.


--
-- Data for Name: supervisor_proyectos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supervisor_proyectos (id, "usuarioId", "proyectoId", "createdAt") FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-11-08 16:43:26
20211116045059	2025-11-08 16:43:28
20211116050929	2025-11-08 16:43:31
20211116051442	2025-11-08 16:43:33
20211116212300	2025-11-08 16:43:35
20211116213355	2025-11-08 16:43:37
20211116213934	2025-11-08 16:43:40
20211116214523	2025-11-08 16:43:43
20211122062447	2025-11-08 16:43:45
20211124070109	2025-11-08 16:43:47
20211202204204	2025-11-08 16:43:49
20211202204605	2025-11-08 16:43:51
20211210212804	2025-11-08 16:43:58
20211228014915	2025-11-08 16:44:00
20220107221237	2025-11-08 16:44:02
20220228202821	2025-11-08 16:44:05
20220312004840	2025-11-08 16:44:07
20220603231003	2025-11-08 16:44:10
20220603232444	2025-11-08 16:44:13
20220615214548	2025-11-08 16:44:15
20220712093339	2025-11-08 16:44:17
20220908172859	2025-11-08 16:44:20
20220916233421	2025-11-08 16:44:22
20230119133233	2025-11-08 16:44:24
20230128025114	2025-11-08 16:44:27
20230128025212	2025-11-08 16:44:29
20230227211149	2025-11-08 16:44:31
20230228184745	2025-11-08 16:44:33
20230308225145	2025-11-08 16:44:35
20230328144023	2025-11-08 16:44:37
20231018144023	2025-11-08 16:44:40
20231204144023	2025-11-08 16:44:43
20231204144024	2025-11-08 16:44:46
20231204144025	2025-11-08 16:44:48
20240108234812	2025-11-08 16:44:50
20240109165339	2025-11-08 16:44:52
20240227174441	2025-11-08 16:44:56
20240311171622	2025-11-08 16:44:59
20240321100241	2025-11-08 16:45:03
20240401105812	2025-11-08 16:45:09
20240418121054	2025-11-08 16:45:12
20240523004032	2025-11-08 16:45:20
20240618124746	2025-11-08 16:45:22
20240801235015	2025-11-08 16:45:24
20240805133720	2025-11-08 16:45:26
20240827160934	2025-11-08 16:45:29
20240919163303	2025-11-08 16:45:32
20240919163305	2025-11-08 16:45:34
20241019105805	2025-11-08 16:45:36
20241030150047	2025-11-08 16:45:44
20241108114728	2025-11-08 16:45:47
20241121104152	2025-11-08 16:45:49
20241130184212	2025-11-08 16:45:52
20241220035512	2025-11-08 16:45:54
20241220123912	2025-11-08 16:45:56
20241224161212	2025-11-08 16:45:58
20250107150512	2025-11-08 16:46:00
20250110162412	2025-11-08 16:46:02
20250123174212	2025-11-08 16:46:04
20250128220012	2025-11-08 16:46:06
20250506224012	2025-11-08 16:46:08
20250523164012	2025-11-08 16:46:10
20250714121412	2025-11-08 16:46:12
20250905041441	2025-11-08 16:46:15
20251103001201	2025-11-12 03:37:07
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-11-08 16:43:22.526192
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-11-08 16:43:22.532581
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-11-08 16:43:22.539587
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-11-08 16:43:22.562364
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-11-08 16:43:22.630734
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-11-08 16:43:22.636841
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-11-08 16:43:22.643789
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-11-08 16:43:22.650757
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-11-08 16:43:22.657592
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-11-08 16:43:22.664903
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-11-08 16:43:22.672384
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-11-08 16:43:22.678927
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-11-08 16:43:22.6879
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-11-08 16:43:22.700989
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-11-08 16:43:22.707927
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-11-08 16:43:22.736968
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-11-08 16:43:22.742969
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-11-08 16:43:22.74894
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-11-08 16:43:22.755164
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-11-08 16:43:22.763219
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-11-08 16:43:22.768988
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-11-08 16:43:22.777859
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-11-08 16:43:22.796523
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-11-08 16:43:22.810473
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-11-08 16:43:22.817354
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-11-08 16:43:22.823676
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2025-11-08 16:43:22.829653
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2025-11-08 16:43:22.848009
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2025-11-08 16:43:22.982427
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2025-11-08 16:43:22.988904
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2025-11-08 16:43:22.994989
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2025-11-08 16:43:23.003568
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2025-11-08 16:43:23.01144
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2025-11-08 16:43:23.020243
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2025-11-08 16:43:23.022381
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2025-11-08 16:43:23.032576
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2025-11-08 16:43:23.038298
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-11-08 16:43:23.051413
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2025-11-08 16:43:23.057721
39	add-search-v2-sort-support	39cf7d1e6bf515f4b02e41237aba845a7b492853	2025-11-08 16:43:23.072314
40	fix-prefix-race-conditions-optimized	fd02297e1c67df25a9fc110bf8c8a9af7fb06d1f	2025-11-08 16:43:23.078886
41	add-object-level-update-trigger	44c22478bf01744b2129efc480cd2edc9a7d60e9	2025-11-08 16:43:23.08905
42	rollback-prefix-triggers	f2ab4f526ab7f979541082992593938c05ee4b47	2025-11-08 16:43:23.096941
43	fix-object-level	ab837ad8f1c7d00cc0b7310e989a23388ff29fc6	2025-11-08 16:43:23.1043
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2025-11-18 03:34:45.924941
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2025-11-18 03:34:45.95982
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2025-11-18 03:34:46.04712
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2025-11-18 03:34:46.054812
48	iceberg-catalog-ids	2666dff93346e5d04e0a878416be1d5fec345d6f	2025-11-18 03:34:46.060967
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, level) FROM stdin;
\.


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.prefixes (bucket_id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict GfYKF9wcST5x39pZzn9I5hA9MiikYiOpLXqE9eOKOFq4GkvQseavAnIa3rrAxY4

