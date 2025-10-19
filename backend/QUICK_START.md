# AgroMax Backend – Guía Rápida

## 1. Requisitos

- Node.js 20+
- PostgreSQL 13+ (local o en la nube)
- Variables de entorno:
  - `DATABASE_URL` (cadena de conexión completa)
  - `JWT_SECRET`
  - `NODE_ENV` (ej. `development`)
  - `PORT` (opcional, por defecto 3000)

## 2. Instalación

```bash
cd backend
npm install
```

## 3. Migraciones y usuario administrador

```bash
npm run migrate          # Ejecuta backend/scripts/migrate.js
npm run create-admin     # Crea admin@agromax.com (password: admin)
```

> Si Render (u otro proveedor) requiere SSL, define `PGSSLMODE=require` antes de ejecutar los scripts.

## 4. Ejecución

```bash
npm run dev   # nodemon server.js
# o
npm start     # node server.js
```

El backend expone los endpoints REST bajo `/api/...` y sirve el frontend estático desde `../frontend`.

## 5. Deploy en Render

- Root Directory: `backend`
- Build Command: `npm ci --omit=dev`
- Start Command: `node server.js`
- Variables de entorno: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `PGSSLMODE=require` (si aplica).

Después de cada cambio importante de esquema:
1. Ejecuta `npm run migrate` localmente.
2. Sube el código.
3. En Render, usa **Clear build cache & Deploy** para asegurarte de que se instalen dependencias y se apliquen scripts actualizados.
