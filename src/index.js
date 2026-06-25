require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const compression = require('compression');

const { connectMongo } = require('./config/mongodb');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const clientesRouter     = require('./routes/clientes');
const empleadosRouter    = require('./routes/empleados');
const facturasRouter     = require('./routes/facturas');
const configFiscalRouter = require('./routes/config_fiscal');
const proyectosRouter    = require('./routes/proyectos');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── CORS manual — primer middleware, antes de todo ────────────
// Forzamos los headers directamente sin depender del paquete cors
// para evitar problemas con proxies o helmet
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ─── Utilidades ────────────────────────────────────────────────
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DESEMPCEO Facturas API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    cors: 'enabled',
  });
});

// ─── Rutas ─────────────────────────────────────────────────────
app.use('/api/clientes',      clientesRouter);
app.use('/api/empleados',     empleadosRouter);
app.use('/api/facturas',      facturasRouter);
app.use('/api/config-fiscal', configFiscalRouter);
app.use('/api/proyectos',     proyectosRouter);

// ─── Manejo de errores ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Arranque ──────────────────────────────────────────────────
const start = async () => {
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
    console.log(`📦 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ CORS: Access-Control-Allow-Origin: *`);
  });
};

start();
