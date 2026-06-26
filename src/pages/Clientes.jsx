import { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { fmtMoney } from '../utils/format';
import { Spinner } from '../components/ui';

export default function Clientes() {
  const [grupos, setGrupos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState('');
  const [expandidos, setExpandidos] = useState({});

  const load = () => {
    setLoading(true);
    api.get('/api/proyectos/agrupados')
      .then(r => {
        setGrupos(r.data.data);
        // Expandir todos por defecto
        const exp = {};
        r.data.data.forEach(g => { exp[g.cliente] = true; });
        setExpandidos(exp);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const gruposFiltrados = q
    ? grupos.map(g => ({
        ...g,
        proyectos: g.proyectos.filter(p =>
          p.nombre_proyecto.toLowerCase().includes(q.toLowerCase()) ||
          g.cliente.toLowerCase().includes(q.toLowerCase()) ||
          (p.id_proyecto || '').toLowerCase().includes(q.toLowerCase())
        )
      })).filter(g => g.proyectos.length > 0)
    : grupos;

  const toggle = (cliente) =>
    setExpandidos(e => ({ ...e, [cliente]: !e[cliente] }));

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Clientes y Proyectos</h2>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {grupos.reduce((acc, g) => acc + g.proyectos.length, 0)} proyectos activos
        </div>
      </div>

      <div className="page-body">
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="form-input" style={{ paddingLeft: 30 }}
              placeholder="Buscar cliente o proyecto…"
              value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>

        {loading ? <Spinner /> : gruposFiltrados.length === 0 ? (
          <div className="empty-state"><p>Sin resultados</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {gruposFiltrados.map(g => (
              <div key={g.cliente} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header del cliente */}
                <div
                  onClick={() => toggle(g.cliente)}
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    background: 'var(--surface2)',
                    borderBottom: expandidos[g.cliente] ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {expandidos[g.cliente]
                    ? <ChevronDown size={16} style={{ color: 'var(--accent)' }} />
                    : <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{g.cliente}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      {g.proyectos.length} proyecto{g.proyectos.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'DM Mono, monospace' }}>
                    {fmtMoney(g.proyectos.reduce((acc, p) => acc + (p.monto_pago || 0), 0))}/mes
                  </div>
                </div>

                {/* Proyectos del cliente */}
                {expandidos[g.cliente] && (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Proyecto</th>
                          <th>Servicio</th>
                          <th>Clasificación</th>
                          <th style={{ textAlign: 'right' }}>Monto</th>
                          <th>Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.proyectos.map(p => (
                          <tr key={p._id}>
                            <td className="mono text-2" style={{ fontSize: 11 }}>{p.id_proyecto || '—'}</td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{p.nombre_proyecto}</div>
                              {p.nomenclatura && (
                                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.nomenclatura}</div>
                              )}
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 200 }}>
                              {p.servicio_activo || '—'}
                            </td>
                            <td>
                              {p.clasificacion && (
                                <span className="badge badge-blue">{p.clasificacion}</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>
                              {p.monto_pago ? fmtMoney(p.monto_pago) : '—'}
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                              {p.tipo_pago || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
