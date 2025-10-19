// // server.js
// const path = require("path");
// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const morgan = require("morgan");
// require("dotenv").config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middlewares de seguridad y utilidades
// app.use(helmet());
// app.use(cors());
// app.use(morgan("dev"));
// app.use(express.json());

// // Rutas de API de ejemplo (acá montarías tus controladores reales)
// app.get("/api/health", (req, res) => {
// res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
// });

// // Si tenés otras rutas de API, agregalas antes de servir estáticos
// // app.use("/api/auth", require("./routes/auth"));
// // app.use("/api/items", require("./routes/items"));

// // Servir archivos estáticos del frontend
// const FRONTEND_DIR = path.join(__dirname, "../frontend");
// app.use(express.static(FRONTEND_DIR));

// // Si tu frontend es SPA (React/Vue/etc.), podrías hacer fallback al index.html.
// // Si NO es SPA, y tenés archivos HTML separados (index.html, login.html), NO hace falta este fallback.
// // De todos modos, este fallback no rompe si los archivos existen.
// app.get("*", (req, res) => {
// res.sendFile(path.join(FRONTEND_DIR, "index.html"));
// });

// app.listen(PORT, () => {
// console.log("Servidor corriendo en http://localhost" + PORT);
// });


// backend/server.js
require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

// ===== Config =====
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, "../frontend");

// ===== Middlewares base =====
app.use(morgan("dev"));
app.use(express.json());

// ===== Seguridad (Helmet + CSP) =====
const isProd = process.env.NODE_ENV === "production";

const CONNECT_SRC = [
  "'self'",
  "https://agromax-final-app-main.onrender.com",
  ...(!isProd ? [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ] : [])
];

const API_ALLOWED_ORIGINS = [
  "https://agromax-final-app-main.onrender.com",
  ...(!isProd ? [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ] : [])
];

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "blob:"],
      "connect-src": CONNECT_SRC,
      "object-src": ["'none'"],
      "frame-ancestors": ["'self'"],
      "base-uri": ["'self'"]
    }
  }
}));

// ===== Servir frontend estático =====
// Cache: HTML sin caché; assets con cache-control corto (1 hora) para dev.
app.use((req, res, next) => {
  if (req.path.endsWith(".html") || req.path === "/" || !path.extname(req.path)) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
  }
  next();
});

app.use(
  express.static(FRONTEND_DIR, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".css" || ext === ".js" || ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".gif" || ext === ".svg" || ext === ".webp" || ext === ".ico") {
        res.setHeader("Cache-Control", "public, max-age=3600"); // 1h
      }
    },
  })
);

// Servir assets del backend (scripts compartidos, etc.) bajo /assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ===== CORS =====
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || API_ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// ===== API de ejemplo =====
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", require("./routes/auth").router);
app.use("/api/admin", require("./routes/admin"));
app.use("/api/animals", require("./routes/animals"));
app.use("/api/rodeos", require("./routes/rodeos"));
app.use("/api/dashboard", require("./routes/dashboard"));

// ===== Fallback de rutas no-API =====
// Si pedís una ruta que no es API y no existe archivo físico,
// devolvemos index.html (útil si tenés una SPA o deep-links).
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();

  // intenta servir un archivo existente; si no existe, cae a index.html
  res.sendFile(path.join(FRONTEND_DIR, "index.html"), (err) => {
    if (err) next();
  });
});

// ===== 404 API =====
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// ===== Error handler =====
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (req.path.startsWith("/api/")) {
    res.status(500).json({ error: "Internal Server Error" });
  } else {
    res.status(500).send("Error interno del servidor");
  }
});

// ===== Start =====
// aca abajo iria la url de el servidor en este caso está en local host
app.listen(PORT, () => {
  console.log("Servidor corriendo en http://localhost:" + PORT);
});
