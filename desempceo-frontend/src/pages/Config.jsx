import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getConfigFiscal, updateConfigFiscal } from '../api';
import { fmtPct } from '../utils/format';
import { Spinner } from '../components/ui';
import { ShieldCheck } from 'lucide-react';

export default function Config() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm();

  useEffect(() => {
    getConfigFiscal()
      .then(r => {
        setConfig(r.data.data);
        reset({
          tasa_iva: (r.data.data.tasa_iva * 100).toFixed(2),
          tasa_isr: (r.data.data.tasa_isr * 100).toFixed(4),
          regimen: r.data.data.regimen,
        });
      })
      .catch(() => toast.error('Error cargando configuración'))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data) => {
    try {
      await updateConfigFiscal({
        tasa_iva: parseFloat(data.tasa_iva) / 100,
        tasa_isr: parseFloat(data.tasa_isr) / 100,
        regimen: data.regimen,
      });
      toast.success('Configuración fiscal actualizada');
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className="page-body"><Spinner /></div>;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Configuración fiscal</h2>
      </div>
      <div className="page-body">
        <div className="card" style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>Tasas RESICO</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                Estas tasas se aplican automáticamente en cada movimiento que se marque como "Se factura".
                Puedes sobreescribirlas por registro si es necesario.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Régimen fiscal</label>
              <input className="form-input" {...register('regimen')} />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Tasa IVA (%)</label>
                <input type="number" step="0.01" className="form-input"
                  {...register('tasa_iva', { required: true, min: 0, max: 100 })} />
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Actualmente: {config ? fmtPct(config.tasa_iva) : '—'}</span>
              </div>
              <div className="form-group">
                <label className="form-label">Tasa ISR RESICO (%)</label>
                <input type="number" step="0.0001" className="form-input"
                  {...register('tasa_isr', { required: true, min: 0, max: 100 })} />
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Actualmente: {config ? fmtPct(config.tasa_isr) : '—'}</span>
              </div>
            </div>

            {/* Tabla de referencia RESICO */}
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--text-2)' }}>
                Tasas ISR RESICO 2025 (referencia SAT)
              </div>
              <table style={{ width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', color: 'var(--text-3)', paddingBottom: 6 }}>Ingresos anuales hasta</th>
                    <th style={{ textAlign: 'right', color: 'var(--text-3)', paddingBottom: 6 }}>Tasa ISR</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['$300,000',   '1.00%'],
                    ['$600,000',   '1.10%'],
                    ['$1,000,000', '1.50%'],
                    ['$2,000,000', '2.00%'],
                    ['$3,500,000', '3.50%'],
                  ].map(([rng, tasa]) => (
                    <tr key={rng}>
                      <td style={{ padding: '4px 0', color: 'var(--text-2)' }}>{rng}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: 'DM Mono, monospace', color: 'var(--accent)' }}>{tasa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="btn btn-primary" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Guardando…' : 'Guardar configuración'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
