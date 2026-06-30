import { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../api';
import { fmtMoney } from '../utils/format';
import { Spinner, Modal } from '../components/ui';

export default function Clientes() {
  const [grupos, setGrupos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState('');
  const [expandidos, setExpandidos] = useState({});
  const [editando, setEditando] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/api/proyectos/agrupados')
      .then(r => {
        setGrupos(r.data.data);
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
          p.nombre_proyecto?.toLowerCase().includes(q.toLowerCase()) ||
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
                <div onClick={() => toggle(g.cliente)} style={{
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', background: 'var(--surface2)',
                  borderBottom: expandidos[g.cliente] ? '1px solid var(--border)' : 'none',
                }}>
                  {expandidos[g.cliente]
                    ? <ChevronDown size={16} style={{ color: 'var(--accent)' }} />
                    : <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />}
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
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.proyectos.map(p => (
                          <tr key={p._id}>
                            <td className="mono text-2" style={{ fontSize: 11 }}>{p.id_proyecto || '—'}</td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{p.nombre_proyecto}</div>
                              {p.nomenclatura && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.nomenclatura}</div>}
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 200 }}>{p.servicio_activo || '—'}</td>
                            <td>{p.clasificacion && <span className="badge badge-blue">{p.clasificacion}</span>}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>
                              {p.monto_pago ? fmtMoney(p.monto_pago) : '—'}
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{p.tipo_pago || '—'}</td>
                            <td>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditando(p)}>
                                <Edit2 size={12} /> Editar
                              </button>
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

      {editando && (
        <ProyectoModal
          proyecto={editando}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); load(); }}
        />
      )}
    </>
  );
}

function ProyectoModal({ proyecto, onClose, onSaved }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      ...proyecto,
      fecha_inicio: proyecto.fecha_inicio
        ? new Date(proyecto.fecha_inicio).toISOString().split('T')[0] : '',
    }
  });

  const onSubmit = async (data) => {
    try {
      // Convertir booleanos
      const payload = {
        ...data,
        monto_pago:              parseFloat(data.monto_pago) || 0,
        presupuesto:             parseFloat(data.presupuesto) || 0,
        pago_comision:           data.pago_comision === true || data.pago_comision === 'true',
        pago_adelantado:         data.pago_adelantado === true || data.pago_adelantado === 'true',
        hace_jornadas:           data.hace_jornadas === true || data.hace_jornadas === 'true',
        requiere_email_paciente: data.requiere_email_paciente === true || data.requiere_email_paciente === 'true',
        onboarding_completado:   data.onboarding_completado === true || data.onboarding_completado === 'true',
        registro_consultas:      data.registro_consultas === true || data.registro_consultas === 'true',
        activo:                  data.activo === true || data.activo === 'true',
      };
      await api.put(`/api/proyectos/${proyecto._id}`, payload);
      toast.success('Proyecto actualizado');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const BoolSelect = ({ name }) => (
    <select className="form-select" {...register(name)}>
      <option value="true">Sí</option>
      <option value="false">No</option>
    </select>
  );

  return (
    <Modal
      title={`Editar: ${proyecto.nombre_proyecto}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </>
      }
    >
      {/* Identificación */}
      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Identificación
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">ID Proyecto</label>
          <input className="form-input" {...register('id_proyecto')} />
        </div>
        <div className="form-group">
          <label className="form-label">Nomenclatura</label>
          <input className="form-input" {...register('nomenclatura')} />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nombre del proyecto</label>
          <input className="form-input" {...register('nombre_proyecto')} />
        </div>
        <div className="form-group">
          <label className="form-label">Num. cliente</label>
          <input className="form-input" {...register('num_cliente')} />
        </div>
      </div>

      {/* Cliente */}
      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Cliente
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nombre cliente</label>
          <input className="form-input" {...register('nombre_cliente')} />
        </div>
        <div className="form-group">
          <label className="form-label">Celular cliente</label>
          <input className="form-input" {...register('celular_personal_cliente')} />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Ciudades</label>
          <input className="form-input" {...register('ciudades')} />
        </div>
        <div className="form-group">
          <label className="form-label">Cédula profesional</label>
          <input className="form-input" {...register('cedula_profesional')} />
        </div>
      </div>

      {/* Pago */}
      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Pago
      </div>
      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label">Monto pago</label>
          <input type="number" className="form-input" {...register('monto_pago')} />
        </div>
        <div className="form-group">
          <label className="form-label">Tipo de pago</label>
          <input className="form-input" {...register('tipo_pago')} />
        </div>
        <div className="form-group">
          <label className="form-label">Días de pago</label>
          <input className="form-input" {...register('dias_pago')} />
        </div>
      </div>
      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label">Presupuesto</label>
          <input type="number" className="form-input" {...register('presupuesto')} />
        </div>
        <div className="form-group">
          <label className="form-label">Pago comisión</label>
          <BoolSelect name="pago_comision" />
        </div>
        <div className="form-group">
          <label className="form-label">Pago adelantado</label>
          <BoolSelect name="pago_adelantado" />
        </div>
      </div>

      {/* Servicio */}
      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Servicio
      </div>
      <div className="form-group">
        <label className="form-label">Servicio activo</label>
        <input className="form-input" {...register('servicio_activo')} />
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Fecha inicio</label>
          <input type="date" className="form-input" {...register('fecha_inicio')} />
        </div>
        <div className="form-group">
          <label className="form-label">Clasificación</label>
          <input className="form-input" {...register('clasificacion')} />
        </div>
      </div>
      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label">Hace jornadas</label>
          <BoolSelect name="hace_jornadas" />
        </div>
        <div className="form-group">
          <label className="form-label">Requiere email paciente</label>
          <BoolSelect name="requiere_email_paciente" />
        </div>
        <div className="form-group">
          <label className="form-label">Registro consultas</label>
          <BoolSelect name="registro_consultas" />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Onboarding completado</label>
          <BoolSelect name="onboarding_completado" />
        </div>
        <div className="form-group">
          <label className="form-label">Activo</label>
          <BoolSelect name="activo" />
        </div>
      </div>

      {/* Redes / IDs */}
      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Cuentas y redes
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">WA Business</label>
          <input className="form-input" {...register('wa_business')} />
        </div>
        <div className="form-group">
          <label className="form-label">Email / ID Calendario</label>
          <input className="form-input" {...register('id_calendario')} />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">ID Cuenta publicitaria</label>
          <input className="form-input" {...register('id_cuenta_publicitaria')} />
        </div>
        <div className="form-group">
          <label className="form-label">ID Cuenta anuncios</label>
          <input className="form-input" {...register('id_cuenta_anuncios')} />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">ID Página Facebook</label>
          <input className="form-input" {...register('id_pagina_fb')} />
        </div>
        <div className="form-group">
          <label className="form-label">ID Página Instagram</label>
          <input className="form-input" {...register('id_pagina_ig')} />
        </div>
      </div>
    </Modal>
  );
}
