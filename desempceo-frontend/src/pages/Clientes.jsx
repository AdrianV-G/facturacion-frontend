import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getClientes } from '../api';
import api from '../api';
import { fmtDate } from '../utils/format';
import { Modal, Spinner, Pagination } from '../components/ui';
import { useForm } from 'react-hook-form';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [meta, setMeta]         = useState(null);
  const [page, setPage]         = useState(1);
  const [q, setQ]               = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);

  const load = () => {
    setLoading(true);
    getClientes({ page, limit: 20, q: q || undefined })
      .then(r => { setClientes(r.data.data); setMeta(r.data.meta); })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, q]);

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Clientes</h2>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={14} /> Nuevo cliente
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
                <thead><tr><th>Nombre</th><th>Empresa</th><th>Email</th><th>Teléfono</th><th>Alta</th><th></th></tr></thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c._id}>
                      <td>{c.nombre}</td>
                      <td className="text-2">{c.empresa || '—'}</td>
                      <td className="text-2">{c.email || '—'}</td>
                      <td className="text-2">{c.telefono || '—'}</td>
                      <td className="text-2">{fmtDate(c.createdAt)}</td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => setModal(c)}>Editar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination meta={meta} page={page} setPage={setPage} />
        </div>
      </div>
      {modal !== null && <ClienteModal cliente={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </>
  );
}

function ClienteModal({ cliente, onClose, onSaved }) {
  const isEdit = !!cliente?._id;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: cliente });

  const onSubmit = async (data) => {
    try {
      if (isEdit) await api.put(`/api/clientes/${cliente._id}`, data);
      else await api.post('/api/clientes', data);
      toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado');
      onSaved();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <Modal title={isEdit ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}
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
          <label className="form-label">Empresa</label>
          <input className="form-input" {...register('empresa')} />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" {...register('email')} />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono</label>
          <input className="form-input" {...register('telefono')} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Notas</label>
        <textarea className="form-textarea" {...register('notas')} />
      </div>
    </Modal>
  );
}
