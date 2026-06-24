import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal, Toggle, FileUpload } from './ui';
import { getClientes, getEmpleados, getConfigFiscal, createFactura, updateFactura } from '../api';
import { SUBTIPOS_POR_TIPO, fmtMoney, fmtPct } from '../utils/format';

export default function FacturaModal({ factura, onClose, onSaved }) {
  const isEdit = !!factura?.id;
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: isEdit ? {
      fecha_operacion: factura.fecha_operacion,
      tipo_operacion:  factura.tipo_operacion,
      subtipo:         factura.subtipo,
      monto:           factura.monto,
      estatus:         factura.estatus,
      notas:           factura.notas || '',
      cliente_id:      factura.cliente_id || '',
      empleado_id:     factura.empleado_id || '',
      tasa_iva:        factura.tasa_iva ? (factura.tasa_iva * 100).toFixed(2) : '',
      tasa_isr:        factura.tasa_isr ? (factura.tasa_isr * 100).toFixed(4) : '',
    } : {
      fecha_operacion: new Date().toISOString().split('T')[0],
      tipo_operacion: 'deposito',
      subtipo: '',
      monto: '',
      estatus: 'pendiente',
      notas: '',
      cliente_id: '',
      empleado_id: '',
      tasa_iva: '16.00',
      tasa_isr: '1.2500',
    }
  });

  const tipo     = watch('tipo_operacion');
  const subtipo  = watch('subtipo');
  const monto    = parseFloat(watch('monto')) || 0;
  const tasaIva  = parseFloat(watch('tasa_iva')) / 100 || 0;
  const tasaIsr  = parseFloat(watch('tasa_isr')) / 100 || 0;

  const [requiereFactura, setRequiereFactura] = useState(isEdit ? factura.requiere_factura : false);
  const [archivo, setArchivo] = useState(null);
  const [clientes, setClientes]   = useState([]);
  const [empleados, setEmpleados] = useState([]);

  // Reset subtipo when tipo changes
  useEffect(() => { setValue('subtipo', ''); }, [tipo]);

  // Load clientes, empleados, config fiscal
  useEffect(() => {
    getClientes({ limit: 200 }).then(r => setClientes(r.data.data)).catch(() => {});
    getEmpleados({ limit: 200 }).then(r => setEmpleados(r.data.data)).catch(() => {});
    if (!isEdit) {
      getConfigFiscal().then(r => {
        setValue('tasa_iva', (r.data.data.tasa_iva * 100).toFixed(2));
        setValue('tasa_isr', (r.data.data.tasa_isr * 100).toFixed(4));
      }).catch(() => {});
    }
  }, []);

  // Cálculos fiscales preview
  const montoBase   = requiereFactura && tasaIva ? monto / (1 + tasaIva) : monto;
  const ivaCalc     = requiereFactura && tasaIva ? monto - montoBase : 0;
  const isrRetenido = requiereFactura && tasaIsr ? montoBase * tasaIsr : 0;
  const netoRecibido = monto - isrRetenido;

  const onSubmit = async (data) => {
    try {
      const form = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== '') form.append(k, v); });
      form.set('requiere_factura', requiereFactura);
      if (requiereFactura) {
        form.set('tasa_iva', (parseFloat(data.tasa_iva) / 100).toString());
        form.set('tasa_isr', (parseFloat(data.tasa_isr) / 100).toString());
      }
      if (archivo) form.append('comprobante', archivo);

      if (isEdit) {
        await updateFactura(factura.id, form);
        toast.success('Movimiento actualizado');
      } else {
        await createFactura(form);
        toast.success('Movimiento registrado');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const subtipos = SUBTIPOS_POR_TIPO[tipo] || [];
  const esDeposito = tipo === 'deposito';
  const esNomina   = subtipo === 'nomina';

  return (
    <Modal
      title={isEdit ? 'Editar movimiento' : 'Nuevo movimiento'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar'}
          </button>
        </>
      }
    >
      {/* Tipo de operación */}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Tipo de operación</label>
          <select className="form-select" {...register('tipo_operacion', { required: true })}>
            <option value="deposito">Depósito</option>
            <option value="cargo">Cargo</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Subtipo</label>
          <select className="form-select" {...register('subtipo', { required: 'Requerido' })}>
            <option value="">Selecciona…</option>
            {subtipos.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {errors.subtipo && <span className="form-error">{errors.subtipo.message}</span>}
        </div>
      </div>

      {/* Cliente (solo depósitos) */}
      {esDeposito && (
        <div className="form-group">
          <label className="form-label">Cliente</label>
          <select className="form-select" {...register('cliente_id', { required: 'Requerido para depósitos' })}>
            <option value="">Selecciona cliente…</option>
            {clientes.map(c => <option key={c._id} value={c._id}>{c.nombre}{c.empresa ? ` — ${c.empresa}` : ''}</option>)}
          </select>
          {errors.cliente_id && <span className="form-error">{errors.cliente_id.message}</span>}
        </div>
      )}

      {/* Empleado (solo nómina) */}
      {esNomina && (
        <div className="form-group">
          <label className="form-label">Empleado</label>
          <select className="form-select" {...register('empleado_id', { required: 'Requerido para nómina' })}>
            <option value="">Selecciona empleado…</option>
            {empleados.map(e => <option key={e._id} value={e._id}>{e.nombre_completo || e.nombre}</option>)}
          </select>
          {errors.empleado_id && <span className="form-error">{errors.empleado_id.message}</span>}
        </div>
      )}

      {/* Fechas y monto */}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Fecha de operación</label>
          <input type="date" className="form-input" {...register('fecha_operacion', { required: 'Requerido' })} />
          {errors.fecha_operacion && <span className="form-error">{errors.fecha_operacion.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Monto (MXN)</label>
          <input type="number" step="0.01" min="0.01" className="form-input"
            placeholder="0.00" {...register('monto', { required: 'Requerido', min: { value: 0.01, message: 'Mayor a 0' } })} />
          {errors.monto && <span className="form-error">{errors.monto.message}</span>}
        </div>
      </div>

      {/* Botón Se factura — solo depósitos */}
      {esDeposito && (
        <Toggle
          checked={requiereFactura}
          onChange={setRequiereFactura}
          label="Se factura"
          sublabel="Activa el cálculo de IVA e ISR RESICO"
        />
      )}

      {/* Tasas y preview fiscal */}
      {esDeposito && requiereFactura && (
        <>
          <div className="tasa-row">
            <div className="form-group">
              <label className="form-label">Tasa IVA (%)</label>
              <input type="number" step="0.01" className="form-input"
                {...register('tasa_iva', { required: requiereFactura })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tasa ISR RESICO (%)</label>
              <input type="number" step="0.0001" className="form-input"
                {...register('tasa_isr', { required: requiereFactura })} />
            </div>
          </div>

          {monto > 0 && (
            <div className="fiscal-box">
              <div className="fiscal-row">
                <span>Monto total facturado</span>
                <span className="mono">{fmtMoney(monto)}</span>
              </div>
              <div className="fiscal-row">
                <span>Base gravable (sin IVA)</span>
                <span className="mono">{fmtMoney(montoBase)}</span>
              </div>
              <div className="fiscal-row">
                <span>IVA trasladado ({fmtPct(tasaIva)})</span>
                <span className="mono">{fmtMoney(ivaCalc)}</span>
              </div>
              <div className="fiscal-row" style={{ color: 'var(--red)' }}>
                <span>ISR retenido ({fmtPct(tasaIsr)})</span>
                <span className="mono">− {fmtMoney(isrRetenido)}</span>
              </div>
              <div className="fiscal-row total">
                <span>Neto a recibir</span>
                <span className="mono text-green">{fmtMoney(netoRecibido)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Estatus */}
      <div className="form-group">
        <label className="form-label">Estatus</label>
        <select className="form-select" {...register('estatus')}>
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Comprobante */}
      <div className="form-group">
        <label className="form-label">Comprobante (PNG, JPG, PDF)</label>
        {isEdit && factura.comprobante_url && !archivo && (
          <div style={{ marginBottom: 8 }}>
            <a href={factura.comprobante_url} target="_blank" rel="noreferrer"
              className="btn btn-ghost btn-sm">Ver comprobante actual</a>
          </div>
        )}
        <FileUpload value={archivo} onChange={setArchivo} />
      </div>

      {/* Notas */}
      <div className="form-group">
        <label className="form-label">Notas</label>
        <textarea className="form-textarea" placeholder="Observaciones opcionales…" {...register('notas')} />
      </div>
    </Modal>
  );
}
