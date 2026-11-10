-- Runs once on empty pii-db volume. Local development only.

CREATE DATABASE travelar_test OWNER travelar_migrator;

CREATE ROLE travelar_app LOGIN PASSWORD 'travelar_dev_only';
CREATE ROLE travelar_test LOGIN PASSWORD 'travelar_dev_only';

GRANT CONNECT ON DATABASE travelar_dev TO travelar_app;
GRANT CONNECT ON DATABASE travelar_test TO travelar_test;
GRANT CONNECT ON DATABASE travelar_test TO travelar_app;
