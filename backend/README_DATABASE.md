# Configuración de Base de Datos (PostgreSQL)

El backend de AgroMax utiliza PostgreSQL en todos los entornos (local, staging y producción).

## Requisitos

- PostgreSQL 13 o superior (local o gestionado)
- Node.js 20 o superior
- `DATABASE_URL` válido (por ejemplo: `postgres://usuario:password@host:5432/agromax`)

## Pasos de configuración

1. **Crear base de datos (opcional en servicios gestionados):**
   ```bash
   createdb agromax
   ```

2. **Definir variables de entorno (`backend/.env`):**
   ```ini
   DATABASE_URL=postgres://usuario:password@localhost:5432/agromax
   JWT_SECRET=coloca_un_secret_seguro
   NODE_ENV=development
   PORT=3000
   ```

3. **Instalar dependencias y ejecutar migraciones:**
   ```bash
   cd backend
   npm install
   npm run migrate
   npm run create-admin   # crea admin@agromax.com / admin
   ```

4. **Iniciar el servidor:**
   ```bash
   npm run dev          # desarrollo (hot reload con nodemon)
   # o
   npm start            # producción
   ```

## Uso en Render

- **Root Directory:** `backend`
- **Build Command:** `npm ci --omit=dev`
- **Start Command:** `node server.js`
- **Variables de entorno:** `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
- Si Render Postgres requiere SSL, define `PGSSLMODE=require` para habilitar `ssl: { rejectUnauthorized: false }`.

## Mantenimiento

- Para volver a ejecutar el esquema completo: `npm run migrate`
- Para generar un administrador nuevamente: `npm run create-admin`
- Exportar datos: `pg_dump "$DATABASE_URL" > backup.sql`
- Importar datos: `psql "$DATABASE_URL" < backup.sql`
