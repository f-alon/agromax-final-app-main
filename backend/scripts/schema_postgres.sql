BEGIN;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Administrators
CREATE TABLE IF NOT EXISTS administrators (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    admin_level TEXT DEFAULT 'admin' CHECK (admin_level IN ('admin', 'super_admin')),
    permissions TEXT DEFAULT '{}',
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_manage_establishments BOOLEAN DEFAULT FALSE,
    can_view_reports BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Establishments
CREATE TABLE IF NOT EXISTS establishments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User establishments
CREATE TABLE IF NOT EXISTS user_establishments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    establishment_id INTEGER REFERENCES establishments(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, establishment_id)
);

-- Rodeos
CREATE TABLE IF NOT EXISTS rodeos (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    establishment_id INTEGER REFERENCES establishments(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Animals
CREATE TABLE IF NOT EXISTS animals (
    id SERIAL PRIMARY KEY,
    senasa_caravan TEXT UNIQUE,
    internal_caravan TEXT,
    name TEXT,
    birth_date DATE,
    breed TEXT,
    mother_id INTEGER REFERENCES animals(id) ON DELETE SET NULL,
    father_name TEXT,
    entry_date DATE DEFAULT CURRENT_DATE,
    observations TEXT,
    establishment_id INTEGER REFERENCES establishments(id) ON DELETE CASCADE,
    current_rodeo_id INTEGER REFERENCES rodeos(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Animal production records
CREATE TABLE IF NOT EXISTS animal_production_records (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    liters_per_day DOUBLE PRECISION,
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Animal health records
CREATE TABLE IF NOT EXISTS animal_health_records (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    treatment TEXT,
    cost DOUBLE PRECISION,
    veterinarian TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Animal reproduction records
CREATE TABLE IF NOT EXISTS animal_reproduction_records (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('service', 'pregnancy', 'birth', 'heat')),
    bull_id INTEGER REFERENCES animals(id) ON DELETE SET NULL,
    expected_birth_date DATE,
    actual_birth_date DATE,
    calf_sex TEXT CHECK (calf_sex IN ('male', 'female')),
    calf_weight DOUBLE PRECISION,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Animal movements
CREATE TABLE IF NOT EXISTS animal_movements (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    from_rodeo_id INTEGER REFERENCES rodeos(id) ON DELETE SET NULL,
    to_rodeo_id INTEGER REFERENCES rodeos(id) ON DELETE SET NULL,
    movement_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Animal photos
CREATE TABLE IF NOT EXISTS animal_photos (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_description TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Animal alerts
CREATE TABLE IF NOT EXISTS animal_alerts (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('pregnancy', 'antibiotics', 'health', 'reproduction', 'production')),
    title TEXT NOT NULL,
    description TEXT,
    alert_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    resolved_date DATE,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    establishment_id INTEGER REFERENCES establishments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    metadata TEXT DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    establishment_id INTEGER REFERENCES establishments(id) ON DELETE CASCADE,
    can_edit_animals BOOLEAN DEFAULT FALSE,
    can_edit_rodeos BOOLEAN DEFAULT FALSE,
    can_move_animals BOOLEAN DEFAULT FALSE,
    can_add_production_records BOOLEAN DEFAULT FALSE,
    can_add_health_records BOOLEAN DEFAULT FALSE,
    can_add_reproduction_records BOOLEAN DEFAULT FALSE,
    can_view_reports BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, establishment_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_administrators_user_id ON administrators(user_id);
CREATE INDEX IF NOT EXISTS idx_establishments_owner_id ON establishments(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_establishments_user_id ON user_establishments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_establishments_establishment_id ON user_establishments(establishment_id);
CREATE INDEX IF NOT EXISTS idx_rodeos_establishment_id ON rodeos(establishment_id);
CREATE INDEX IF NOT EXISTS idx_animals_establishment_id ON animals(establishment_id);
CREATE INDEX IF NOT EXISTS idx_animals_current_rodeo_id ON animals(current_rodeo_id);
CREATE INDEX IF NOT EXISTS idx_animals_senasa_caravan ON animals(senasa_caravan);
CREATE INDEX IF NOT EXISTS idx_animals_internal_caravan ON animals(internal_caravan);
CREATE INDEX IF NOT EXISTS idx_animal_production_records_animal_id ON animal_production_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_production_records_date ON animal_production_records(record_date);
CREATE INDEX IF NOT EXISTS idx_animal_health_records_animal_id ON animal_health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_health_records_date ON animal_health_records(record_date);
CREATE INDEX IF NOT EXISTS idx_animal_reproduction_records_animal_id ON animal_reproduction_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_reproduction_records_date ON animal_reproduction_records(record_date);
CREATE INDEX IF NOT EXISTS idx_animal_movements_animal_id ON animal_movements(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_movements_date ON animal_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_animal_photos_animal_id ON animal_photos(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_alerts_animal_id ON animal_alerts(animal_id);
CREATE INDEX IF NOT EXISTS idx_animal_alerts_type ON animal_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_animal_alerts_active ON animal_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_activity_log_establishment_id ON activity_log(establishment_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_establishment ON user_permissions(user_id, establishment_id);

COMMIT;
