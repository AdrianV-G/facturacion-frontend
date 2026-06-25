-- ============================================================
-- DESEMPCEO FACTURAS — Migración v3
-- Renombra cliente_id → proyecto_id en tabla facturas
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Si es instalación nueva (tabla vacía), ejecuta el schema completo v2
-- Si ya tienes datos, ejecuta solo esta migración:

-- 1. Renombrar columna
ALTER TABLE facturas RENAME COLUMN cliente_id TO proyecto_id;

-- 2. Actualizar restricción de negocio
ALTER TABLE facturas DROP CONSTRAINT IF EXISTS deposito_requiere_cliente;
ALTER TABLE facturas ADD CONSTRAINT deposito_requiere_proyecto
  CHECK (tipo_operacion != 'deposito' OR proyecto_id IS NOT NULL);

-- 3. Actualizar índice
DROP INDEX IF EXISTS idx_facturas_cliente;
CREATE INDEX idx_facturas_proyecto ON facturas (proyecto_id);

-- ¡Listo! Si quieres verificar:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'facturas';
