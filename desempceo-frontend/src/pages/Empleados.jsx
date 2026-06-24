import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEmpleados } from '../api';
import api from '../api';
import { fmtMoney, fmtDate } from '../utils/format';
import { Modal, Spinner, Pagination } from '../components/ui';
import { useForm } from 'react-hook-form';

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [meta, setMeta]           = useState(null);
  const [page, setPage]           = useState(1);
  const [q, setQ]                 = useState('');
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);

  const load = () => {
    setLoading(true);
    getEmpleados({ page, limit: 20, q: q || undefined })
      .then(r => { setEmpleados(r.data.data); setMeta(r.data.meta); })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, q]);

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Empleados</h2>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={14} /> Nuevo empleado
        </button>
      </div>
      <div className="page-body">
        <div className="filters-bar" style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="form-input" style={{ paddingLeft: 30 }} placeholder="Buscar…" value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }} />
          </div>
        </div>
        <div className="card">
          {loading ? <Spinner /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Nombre</th><th>Puesto</th><th>Email</th><th>Salario base</th><th>Ingreso</th><th></th></tr></thead>
                <tbody>
                  {empleados.map(e => (
                    <tr key={e._id}>
                      <td>{e.nombre_completo || e.nombre}</td>
                      <td className="text-2">{e.puesto || '—'}</td>
                      <td className="text-2">{e.email || '—'}</td>
                      <td className="mono">{e.salario_base ? fmtMoney(e.salario_base) : '—'}</td>
                      <td className="text-2">{e.fecha_ingreso ? fmtDate(e.fecha_ingreso) : '—'}</td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => setModal(e)}>Editar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination meta={meta} page={page} setPage={setPage} />
        </div>
      </div>
      {modal !== null && <EmpleadoModal empleado={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </>
  );
}

function EmpleadoModal({ empleado, onClose, onSaved }) {
  const isEdit = !!empleado?._id;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      ...empleado,
      fecha_ingreso: empleado?.fecha_ingreso ? empleado.fecha_ingreso.split('T')[0] : '',
    }
  });

  const onSubmit = async (data) => {
    try {
      if (isEdit) await api.put(`/api/empleados/${empleado._id}`, data);
      else await api.post('/api/empleados', data);
      toast.success(isEdit ? 'Empleado actualizado' : 'Empleado creado');
      onSaved();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <Modal title={isEdit ? 'Editar empleado' : 'Nuevo empleado'} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar'}
        </button>
      </>}>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input className="form-input" {...register('nombre', { required: 'Requerido' })} />
          {errors.nombre && <span className="form-error">{errors.nombre.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Apellido</label>
          <input className="form-input" {...register('apellido')} />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Puesto</label>
          <input className="form-input" {...register('puesto')} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" {...register('email')} />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Salario base (MXN)</label>
          <input className="form-input" type="number" step="0.01" {...register('salario_base')} />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de ingreso</label>
          <input className="form-input" type="date" {...register('fecha_ingreso')} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Notas</label>
        <textarea className="form-textarea" {...register('notas')} />
      </div>
    </Modal>
  );
}
