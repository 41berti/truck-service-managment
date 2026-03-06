-- GarageFlow / Truck Service Management
-- PostgreSQL schema.sql

BEGIN;

-- 1) ENUM TYPES (tipa të kufizuar / vlera të lejuara)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN','MECHANIC','GUARD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('INCOME','EXPENSE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('SCHEDULED','IN_PROGRESS','DONE','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE stock_movement_type AS ENUM ('IN','OUT','ADJUST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) USERS (përdoruesit)
CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL PRIMARY KEY,
  full_name       VARCHAR(120) NOT NULL,
  email           VARCHAR(120) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) ATTENDANCE (evidenca e punonjësve)
CREATE TABLE IF NOT EXISTS attendance (
  id                BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  work_date         DATE NOT NULL,
  check_in          TIMESTAMPTZ NOT NULL,
  signature_in_url  VARCHAR(500) NOT NULL,
  check_out         TIMESTAMPTZ,
  signature_out_url VARCHAR(500),
  notes             VARCHAR(500),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attendance_user_day UNIQUE (user_id, work_date),
  CONSTRAINT ck_attendance_checkout_after_checkin
    CHECK (check_out IS NULL OR check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_attendance_work_date ON attendance(work_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);

-- 4) TRANSACTIONS (hyrje/dalje financiare)
CREATE TABLE IF NOT EXISTS transactions (
  id            BIGSERIAL PRIMARY KEY,
  type          transaction_type NOT NULL,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description   VARCHAR(1000) NOT NULL,
  category      VARCHAR(80),
  tx_date       DATE NOT NULL,
  created_by    BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_tx_date ON transactions(tx_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);

-- 5) CLIENTS (klientët)
CREATE TABLE IF NOT EXISTS clients (
  id            BIGSERIAL PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  phone         VARCHAR(30),
  company_name  VARCHAR(120),
  notes         VARCHAR(500),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_full_name ON clients(full_name);

-- 6) TRUCKS (kamionët)
CREATE TABLE IF NOT EXISTS trucks (
  id            BIGSERIAL PRIMARY KEY,
  plate_number  VARCHAR(20) NOT NULL UNIQUE,
  brand         VARCHAR(30) NOT NULL,      -- (p.sh. Scania/Volvo/Man...)
  model         VARCHAR(50),
  vin           VARCHAR(32) UNIQUE,
  client_id     BIGINT REFERENCES clients(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trucks_brand ON trucks(brand);
CREATE INDEX IF NOT EXISTS idx_trucks_client_id ON trucks(client_id);

-- 7) APPOINTMENTS (terminet)
CREATE TABLE IF NOT EXISTS appointments (
  id               BIGSERIAL PRIMARY KEY,
  client_id        BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  truck_id         BIGINT NOT NULL REFERENCES trucks(id) ON DELETE RESTRICT,
  service_date     DATE NOT NULL,
  issue_description VARCHAR(1000),
  status           appointment_status NOT NULL DEFAULT 'SCHEDULED',
  created_by       BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_service_date ON appointments(service_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_truck_id ON appointments(truck_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);

-- 8) STOCK_ITEMS (artikujt në depo)
CREATE TABLE IF NOT EXISTS stock_items (
  id            BIGSERIAL PRIMARY KEY,
  item_code     VARCHAR(40) UNIQUE,        -- kodi nga lista/PDF (nëse ekziston)
  name          VARCHAR(160) NOT NULL,
  category      VARCHAR(80),
  unit          VARCHAR(20),               -- copë / L / set
  current_qty   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_qty >= 0),
  min_qty       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (min_qty >= 0),
  unit_cost     NUMERIC(12,2) CHECK (unit_cost >= 0),
  supplier      VARCHAR(120),
  location      VARCHAR(60),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_items_name ON stock_items(name);
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category);

-- 9) STOCK_MOVEMENTS (hyrje/dalje/korigjim i stokut)
CREATE TABLE IF NOT EXISTS stock_movements (
  id             BIGSERIAL PRIMARY KEY,
  stock_item_id  BIGINT NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
  movement_type  stock_movement_type NOT NULL,
  quantity       NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit_cost      NUMERIC(12,2) CHECK (unit_cost >= 0),
  note           VARCHAR(500),
  created_by     BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  movement_date  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);

COMMIT;