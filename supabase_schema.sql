-- ============================================================
-- DESEMPCEO FACTURAS — Schema Supabase v2 (con RESICO)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enum: tipo de operación
CREATE TYPE tipo_operacion_enum AS ENUM ('deposito', 'cargo');

-- Enum: subtipo de operación
CREATE TYPE subtipo_enum AS ENUM (
  'honorarios',
  'comisiones_por_venta',
  'pautas',
  'nomina',
  'licencia',
  'servicio'
);

-- Enum: estatus
CREATE TYPE estatus_enum AS ENUM ('pendiente', 'confirmado', 'cancelado');

-- ─── Configuración fiscal RESICO ─────────────────────────────
-- Una sola fila; se actualiza, nunca se inserta otra
CREATE TABLE config_fiscal (
  id              INT         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tasa_iva        NUMERIC(5,4) NOT NULL DEFAULT 0.16,   -- 16%
  tasa_isr        NUMERIC(5,4) NOT NULL DEFAULT 0.0125, -- 1.25% RESICO
  regimen         TEXT        NOT NULL DEFAULT 'RESICO',
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar valores default RESICO
INSERT INTO config_fiscal (id, tasa_iva, tasa_isr, regimen)
VALUES (1, 0.16, 0.0125, 'RESICO')
ON CONFLICT (id) DO NOTHING;

-- ─── Tabla principal ──────────────────────────────────────────
CREATE TABLE facturas (
  id                UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  folio             SERIAL             NOT NULL,

  -- Fechas
  fecha_registro    TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  fecha_operacion   DATE               NOT NULL,

  -- Operación
  tipo_operacion    tipo_operacion_enum NOT NULL,
  subtipo           subtipo_enum        NOT NULL,
  estatus           estatus_enum        NOT NULL DEFAULT 'pendiente',

  -- Montos
  monto             NUMERIC(12, 2)     NOT NULL CHECK (monto > 0),

  -- Facturación y fiscal (solo depósitos)
  requiere_factura  BOOLEAN            NOT NULL DEFAULT false,
  tasa_iva          NUMERIC(5, 4),     -- NULL = sin IVA aplicado
  tasa_isr          NUMERIC(5, 4),     -- NULL = sin ISR aplicado
  monto_base        NUMERIC(12, 2)     GENERATED ALWAYS AS (
                      CASE
                        WHEN requiere_factura AND tasa_iva IS NOT NULL
                        THEN ROUND(monto / (1 + tasa_iva), 2)
                        ELSE monto
                      END
                    ) STORED,
  iva_calculado     NUMERIC(12, 2)     GENERATED ALWAYS AS (
                      CASE
                        WHEN requiere_factura AND tasa_iva IS NOT NULL
                        THEN ROUND(monto - (monto / (1 + tasa_iva)), 2)
                        ELSE 0
                      END
                    ) STORED,
  isr_retenido      NUMERIC(12, 2)     GENERATED ALWAYS AS (
                      CASE
                        WHEN requiere_factura AND tasa_isr IS NOT NULL
                        THEN ROUND((monto / (1 + COALESCE(tasa_iva, 0))) * tasa_isr, 2)
                        ELSE 0
                      END
                    ) STORED,
  neto_recibido     NUMERIC(12, 2)     GENERATED ALWAYS AS (
                      CASE
                        WHEN requiere_factura
                        THEN ROUND(
                          monto
                          - CASE WHEN tasa_isr IS NOT NULL
                              THEN (monto / (1 + COALESCE(tasa_iva, 0))) * tasa_isr
                              ELSE 0 END,
                          2)
                        ELSE monto
                      END
                    ) STORED,

  -- Referencias a MongoDB Atlas
  cliente_id        TEXT,
  empleado_id       TEXT,

  -- Comprobante
  comprobante_url   TEXT,

  -- Notas
  notas             TEXT,

  -- ─── Restricciones de negocio ────────────────────────────
  CONSTRAINT deposito_requiere_cliente
    CHECK (tipo_operacion != 'deposito' OR cliente_id IS NOT NULL),

  CONSTRAINT nomina_requiere_empleado
    CHECK (subtipo != 'nomina' OR empleado_id IS NOT NULL),

  -- factura solo aplica en depósitos
  CONSTRAINT factura_solo_en_deposito
    CHECK (tipo_operacion = 'deposito' OR requiere_factura = false),

  -- si requiere factura, tasas deben estar presentes
  CONSTRAINT factura_requiere_tasas
    CHECK (
      requiere_factura = false
      OR (tasa_iva IS NOT NULL AND tasa_isr IS NOT NULL)
    )
);

-- ─── Índices ──────────────────────────────────────────────────
CREATE INDEX idx_facturas_tipo        ON facturas (tipo_operacion);
CREATE INDEX idx_facturas_subtipo     ON facturas (subtipo);
CREATE INDEX idx_facturas_estatus     ON facturas (estatus);
CREATE INDEX idx_facturas_fecha_op    ON facturas (fecha_operacion DESC);
CREATE INDEX idx_facturas_cliente     ON facturas (cliente_id);
CREATE INDEX idx_facturas_empleado    ON facturas (empleado_id);
CREATE INDEX idx_facturas_folio       ON facturas (folio);
CREATE INDEX idx_facturas_factura     ON facturas (requiere_factura);

-- ─── Vista: Resumen mensual con fiscal ───────────────────────
DROP VIEW IF EXISTS resumen_mensual;
CREATE VIEW resumen_mensual AS
SELECT
  DATE_TRUNC('month', fecha_operacion)  AS mes,
  tipo_operacion,
  subtipo,
  COUNT(*)                              AS cantidad,
  SUM(monto)                            AS total_bruto,
  SUM(CASE WHEN requiere_factura THEN iva_calculado ELSE 0 END)  AS total_iva,
  SUM(CASE WHEN requiere_factura THEN isr_retenido  ELSE 0 END)  AS total_isr,
  SUM(neto_recibido)                    AS total_neto,
  COUNT(*) FILTER (WHERE requiere_factura)  AS con_factura,
  COUNT(*) FILTER (WHERE NOT requiere_factura) AS sin_factura
FROM facturas
WHERE estatus != 'cancelado'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2, 3;

-- ─── Vista: Obligaciones fiscales por mes (para declaración) ─
CREATE VIEW obligaciones_fiscales AS
SELECT
  DATE_TRUNC('month', fecha_operacion)  AS mes,
  SUM(monto_base)                       AS base_gravable,
  SUM(iva_calculado)                    AS iva_trasladado,
  SUM(isr_retenido)                     AS isr_retenido,
  COUNT(*) FILTER (WHERE requiere_factura) AS facturas_emitidas
FROM facturas
WHERE estatus != 'cancelado'
  AND tipo_operacion = 'deposito'
  AND requiere_factura = true
GROUP BY 1
ORDER BY 1 DESC;

-- ─── Bucket de Storage ───────────────────────────────────────
-- Ejecutar en: Supabase Dashboard > Storage > New Bucket
-- Nombre: comprobantes | Public: TRUE

-- ─── RLS (activar si usas Auth de Supabase) ──────────────────
-- ALTER TABLE facturas    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE config_fiscal ENABLE ROW LEVEL SECURITY;
