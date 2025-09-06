-- migrations/002_create_agromax_tables.sql
-- Create tables for AgroMax animal management system (SQLite3 version)

-- Create rodeos table
CREATE TABLE IF NOT EXISTS rodeos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    establishment_id INTEGER REFERENCES establishments(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create animals table
CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senasa_caravan TEXT UNIQUE, -- Caravana SENASA (identificador oficial)
    internal_caravan TEXT, -- Caravana Interna (identificador de manejo del establecimiento)
    name TEXT, -- Nombre del animal
    birth_date DATE, -- Fecha de Nacimiento
    breed TEXT, -- Raza
    mother_id INTEGER REFERENCES animals(id) ON DELETE SET NULL, -- ID de la Madre
    father_name TEXT, -- Nombre del Padre
    entry_date DATE DEFAULT (date('now')), -- Fecha de Ingreso al sistema/establecimiento
    observations TEXT, -- Observaciones
    establishment_id INTEGER REFERENCES establishments(id) ON DELETE CASCADE,
    current_rodeo_id INTEGER REFERENCES rodeos(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create animal_production_records table (Historial de Registros de Producción)
CREATE TABLE IF NOT EXISTS animal_production_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    liters_per_day REAL, -- Litros por día
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5), -- Calidad (1-5)
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create animal_health_records table (Historial de Registros de Salud)
CREATE TABLE IF NOT EXISTS animal_health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    event_type TEXT NOT NULL, -- Tipo de evento (vacunación, tratamiento, etc.)
    description TEXT,
    treatment TEXT,
    cost REAL,
    veterinarian TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create animal_reproduction_records table (Historial de Registros de Reproducción)
CREATE TABLE IF NOT EXISTS animal_reproduction_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('service', 'pregnancy', 'birth', 'heat')), -- Tipo: servicio, preñez, parto, celo
    bull_id INTEGER REFERENCES animals(id) ON DELETE SET NULL, -- ID del toro (para servicios)
    expected_birth_date DATE, -- Fecha esperada de parto
    actual_birth_date DATE, -- Fecha real de parto
    calf_sex TEXT CHECK (calf_sex IN ('male', 'female')), -- Sexo del ternero
    calf_weight REAL, -- Peso del ternero
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create animal_movements table (Historial de Movimientos)
CREATE TABLE IF NOT EXISTS animal_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    from_rodeo_id INTEGER REFERENCES rodeos(id) ON DELETE SET NULL,
    to_rodeo_id INTEGER REFERENCES rodeos(id) ON DELETE SET NULL,
    movement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create animal_photos table (Fotos del animal)
CREATE TABLE IF NOT EXISTS animal_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_description TEXT,
    is_primary BOOLEAN DEFAULT 0, -- Foto principal
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create animal_alerts table (Alertas del animal)
CREATE TABLE IF NOT EXISTS animal_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('pregnancy', 'antibiotics', 'health', 'reproduction', 'production')),
    title TEXT NOT NULL,
    description TEXT,
    alert_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    resolved_date DATE,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create activity_log table (Historial de Actividades del Establecimiento)
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    establishment_id INTEGER REFERENCES establishments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL, -- Tipo de actividad
    description TEXT NOT NULL,
    entity_type TEXT, -- Tipo de entidad afectada (animal, rodeo, etc.)
    entity_id INTEGER, -- ID de la entidad afectada
    metadata TEXT DEFAULT '{}', -- Datos adicionales en formato JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create user_permissions table (Permisos específicos por establecimiento)
CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    establishment_id INTEGER REFERENCES establishments(id) ON DELETE CASCADE,
    can_edit_animals BOOLEAN DEFAULT 0,
    can_edit_rodeos BOOLEAN DEFAULT 0,
    can_move_animals BOOLEAN DEFAULT 0,
    can_add_production_records BOOLEAN DEFAULT 0,
    can_add_health_records BOOLEAN DEFAULT 0,
    can_add_reproduction_records BOOLEAN DEFAULT 0,
    can_view_reports BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, establishment_id)
);

-- Create indexes for better performance
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

-- Create triggers to automatically update updated_at
CREATE TRIGGER IF NOT EXISTS update_rodeos_updated_at 
    AFTER UPDATE ON rodeos
    FOR EACH ROW
    BEGIN
        UPDATE rodeos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_animals_updated_at 
    AFTER UPDATE ON animals
    FOR EACH ROW
    BEGIN
        UPDATE animals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_user_permissions_updated_at 
    AFTER UPDATE ON user_permissions
    FOR EACH ROW
    BEGIN
        UPDATE user_permissions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;