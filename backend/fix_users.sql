-- Ver columnas actuales (solo para verificación)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='users'
ORDER BY ordinal_position;

-- Asegurar columnas que usa el backend
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name  TEXT,
  ADD COLUMN IF NOT EXISTS phone      TEXT,
  ADD COLUMN IF NOT EXISTS role       TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Índice único por email (seguro y repetible)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON public.users(email);

-- (Opcional pero recomendado) trigger simple para updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at := NOW();
      RETURN NEW;
    END; $$ LANGUAGE plpgsql;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_users_updated_at') THEN
    CREATE TRIGGER tg_users_updated_at
      BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Tabla administrators (si no existe)
CREATE TABLE IF NOT EXISTS public.administrators (
  user_id                INTEGER PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  admin_level            TEXT NOT NULL DEFAULT 'admin',
  can_manage_users       BOOLEAN NOT NULL DEFAULT TRUE,
  can_manage_establishments BOOLEAN NOT NULL DEFAULT TRUE,
  can_view_reports       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at en administrators
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_admins_updated_at') THEN
    CREATE TRIGGER tg_admins_updated_at
      BEFORE UPDATE ON public.administrators
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
