import { X, Upload, Eye } from 'lucide-react';
import { useRef, useState } from 'react';
import { ESTATUS_CONFIG } from '../../utils/format';

// ── Badge ──────────────────────────────────────────────────
export function Badge({ estatus }) {
  const cfg = ESTATUS_CONFIG[estatus] || { label: estatus, cls: 'badge-gray' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

// ── Toggle ─────────────────────────────────────────────────
export function Toggle({ checked, onChange, label, sublabel }) {
  return (
    <div className="toggle-row">
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{sublabel}</div>}
      </div>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── File upload ────────────────────────────────────────────
export function FileUpload({ value, onChange }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);

  const handle = (file) => {
    if (!file) return;
    const ok = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!ok.includes(file.type)) return alert('Solo PNG, JPG, WEBP o PDF');
    if (file.size > 10 * 1024 * 1024) return alert('Máximo 10 MB');
    onChange(file);
  };

  return (
    <div>
      <div
        className={`file-drop ${drag ? 'drag-over' : ''}`}
        onClick={() => ref.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      >
        <input ref={ref} type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" onChange={(e) => handle(e.target.files[0])} />
        <Upload size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
        {value
          ? <span style={{ color: 'var(--accent)' }}>{value.name || 'Archivo seleccionado'}</span>
          : <span>Arrastra o haz clic — PNG, JPG, PDF · máx 10 MB</span>
        }
      </div>
    </div>
  );
}

// ── Comprobante link ───────────────────────────────────────
export function ComprobanteLink({ url }) {
  if (!url) return <span className="text-2">—</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
      <Eye size={13} /> Ver
    </a>
  );
}

// ── Pagination ─────────────────────────────────────────────
export function Pagination({ meta, page, setPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="pagination">
      <span className="pagination-info">{meta.total} registros</span>
      <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>‹ Anterior</button>
      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{page} / {meta.pages}</span>
      <button className="btn btn-ghost btn-sm" disabled={page === meta.pages} onClick={() => setPage(page + 1)}>Siguiente ›</button>
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
      Cargando…
    </div>
  );
}
