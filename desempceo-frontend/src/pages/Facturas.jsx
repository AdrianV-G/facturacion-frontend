import { useEffect, useState } from 'react';
import { Plus, RefreshCw, FileX } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFacturas, cancelarFactura } from '../api';
import { fmtMoney, fmtDate, TIPO_LABELS, SUBTIPO_LABELS } from '../utils/format';
import { Badge, ComprobanteLink, Pagination, Spinner } from '../components/ui';
import FacturaModal from '../components/FacturaModal';

const FILTROS_INIT = { tipo_operacion: '', subtipo: '', estatus: '', fecha_desde: '', fecha_hasta: '' };

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [meta, setMeta]         = useState(null);
  const [page, setPage]         = useState(1);
  const [filtros, setFiltros]   = useState(FILTROS_INIT);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'new' | factura obj

  const load = () => {
    setLoading(true);
    const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filtros).filter(([, v]) => v)) };
    getFacturas(params)
      .then(r => { setFacturas(r.data.data); setMeta(r.data.meta); })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, filtros]);

  const handleCancelar = async (id) => {
    if (!confirm('¿Cancelar este movimiento?')) return;
    try { await cancelarFactura(id); toast.success('Cancelado'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const setFiltro = (k, v) => { setFiltros(f => ({ ...f, [k]: v })); setPage(1); };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Movimientos</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={load}><RefreshCw size={14} /></button>
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={14} /> Nuevo movimiento
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filtros */}
        <div className="filters-bar" style={{ marginBottom: 16 }}>
          <select className="form-select" value={filtros.tipo_operacion} onChange={e => setFiltro('tipo_operacion', e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="deposito">Depósito</option>
            <option value="cargo">Cargo</option>
          </select>
          <select className="form-select" value={filtros.estatus} onChange={e => setFiltro('estatus', e.target.value)}>
            <option value="">Todos los estatus</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <input type="date" className="form-input" value={filtros.fecha_desde} onChange={e => setFiltro('fecha_desde', e.target.value)} />
          <input type="date" className="form-input" value={filtros.fecha_hasta} onChange={e => setFiltro('fecha_hasta', e.target.value)} />
          {Object.values(filtros).some(Boolean) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFiltros(FILTROS_INIT); setPage(1); }}>
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="card">
          {loading ? <Spinner /> : facturas.length === 0 ? (
            <div className="empty-state">
              <FileX size={32} style={{ margin: '0 auto' }} />
              <p>Sin movimientos. Registra el primero.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Fecha op.</th>
                    <th>Tipo</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                    <th>Neto</th>
                    <th>Factura</th>
                    <th>Estatus</th>
                    <th>Comprobante</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {facturas.map(f => (
                    <tr key={f.id}>
                      <td className="mono text-2">#{f.folio}</td>
                      <td>{fmtDate(f.fecha_operacion)}</td>
                      <td>
                        <span className={`badge ${f.tipo_operacion === 'deposito' ? 'badge-green' : 'badge-red'}`}>
                          {TIPO_LABELS[f.tipo_operacion]}
                        </span>
                      </td>
                      <td>{SUBTIPO_LABELS[f.subtipo] || f.subtipo}</td>
                      <td className="mono">{fmtMoney(f.monto)}</td>
                      <td className="mono">
                        {f.requiere_factura
                          ? <span className="text-green">{fmtMoney(f.neto_recibido)}</span>
                          : <span className="text-2">—</span>
                        }
                      </td>
                      <td>
                        {f.tipo_operacion === 'deposito'
                          ? <span className={`badge ${f.requiere_factura ? 'badge-blue' : 'badge-gray'}`}>
                              {f.requiere_factura ? 'Sí' : 'No'}
                            </span>
                          : <span className="text-2">—</span>
                        }
                      </td>
                      <td><Badge estatus={f.estatus} /></td>
                      <td><ComprobanteLink url={f.comprobante_url} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal(f)}>Editar</button>
                          {f.estatus !== 'cancelado' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleCancelar(f.id)}>
                              <FileX size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination meta={meta} page={page} setPage={setPage} />
        </div>
      </div>

      {modal && (
        <FacturaModal
          factura={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </>
  );
}
