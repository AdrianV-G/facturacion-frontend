import { useEffect, useState } from 'react';
import { getResumen, getResumenFiscal } from '../api';
import { fmtMoney, fmtPct } from '../utils/format';
import { Spinner } from '../components/ui';
import { TrendingUp, TrendingDown, Scale, Receipt, FileCheck } from 'lucide-react';

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [fiscal, setFiscal]   = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [mes, setMes]   = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getResumen({ mes, anio }),
      getResumenFiscal({ anio }),
    ]).then(([r, f]) => {
      setResumen(r.data.data);
      setFiscal(f.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [mes, anio]);

  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="form-select" value={mes} onChange={e => setMes(+e.target.value)}>
            {meses.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="form-select" value={anio} onChange={e => setAnio(+e.target.value)}>
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="page-body">
        {loading ? <Spinner /> : !resumen ? (
          <div className="empty-state"><p>Sin datos para este periodo</p></div>
        ) : (
          <>
            {/* Stats principales */}
            <div className="card-grid" style={{ marginBottom: 20 }}>
              <StatCard icon={TrendingUp} color="green" label="Total depósitos" value={fmtMoney(resumen.total_depositos)} />
              <StatCard icon={TrendingDown} color="red" label="Total cargos" value={fmtMoney(resumen.total_cargos)} />
              <StatCard
                icon={Scale}
                color={resumen.balance >= 0 ? 'green' : 'red'}
                label="Balance"
                value={fmtMoney(resumen.balance)}
              />
              <StatCard icon={FileCheck} color="blue" label="Facturas emitidas" value={resumen.facturas_emitidas} />
            </div>

            {/* Fiscal RESICO */}
            {resumen.total_iva > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={16} style={{ color: 'var(--accent)' }} />
                  Resumen fiscal RESICO — {meses[mes-1]} {anio}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <FiscalStat label="IVA trasladado" value={fmtMoney(resumen.total_iva)} color="var(--accent)" />
                  <FiscalStat label="ISR retenido" value={fmtMoney(resumen.total_isr)} color="var(--red)" />
                  <FiscalStat label="Neto recibido" value={fmtMoney(resumen.total_neto)} color="var(--green)" />
                </div>
              </div>
            )}

            {/* Por subtipo */}
            {Object.keys(resumen.por_subtipo).length > 0 && (
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 14 }}>Desglose por tipo</div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Concepto</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(resumen.por_subtipo).map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{fmtMoney(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  const colors = { green: 'var(--green)', red: 'var(--red)', blue: 'var(--accent)' };
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon size={16} style={{ color: colors[color] }} />
        <span className="stat-label" style={{ marginBottom: 0 }}>{label}</span>
      </div>
      <div className="stat-value" style={{ color: colors[color] }}>{value}</div>
    </div>
  );
}

function FiscalStat({ label, value, color }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, fontWeight: 500, color }}>{value}</div>
    </div>
  );
}
