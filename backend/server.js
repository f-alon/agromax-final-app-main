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
app.use(cors()); // si todo vive en el mismo origen, igual no molesta

// ===== Seguridad (Helmet + CSP) =====
// IMPORTANTE: con esta CSP, NO se permiten <script> inline ni CDNs de JS.
// Tus <script> deben estar en archivos locales (p. ej. /assets/login.js).
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // por defecto, todo al mismo origen
        defaultSrc: ["'self'"],

        // scripts solo locales (sin inline, sin eval)
        scriptSrc: ["'self'"],

        // estilos locales; si más adelante necesitás inline CSS,
        // podés sumar "'unsafe-inline'" aquí, pero evita usarlo.
        styleSrc: ["'self'", "https://fonts.googleapis.com"],

        // fuentes e imágenes locales; data: permite íconos embebidos/base64
        fontSrc: ["'self'", "data:","https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],

        // llamadas XHR/fetch al mismo origen (tu API corre acá mismo)
        connectSrc: ["'self'"],

        // deshabilitar plugins/objetos
        objectSrc: ["'none'"],

        // evita que sitios externos te embeban en iframes
        frameAncestors: ["'self'"],

        // restringe <base>
        baseUri: ["'self'"],
      },
    },

    // otras protecciones útiles
    referrerPolicy: { policy: "no-referrer" },
    crossOriginEmbedderPolicy: false, // para evitar bloqueos innecesarios en dev
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
  })
);

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
    console.log("Servidor corriendo en http://localhost" + PORT); 
});