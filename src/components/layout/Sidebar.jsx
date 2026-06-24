import { LayoutDashboard, FileText, Users, UserCheck, Settings } from 'lucide-react';

const nav = [
  { id: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'facturas',   label: 'Movimientos', icon: FileText },
  { id: 'clientes',   label: 'Clientes',    icon: Users },
  { id: 'empleados',  label: 'Empleados',   icon: UserCheck },
  { id: 'config',     label: 'Configuración', icon: Settings },
];

export default function Sidebar({ page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>DESEMPCEO</h1>
        <p>Sistema de facturación</p>
      </div>
      <nav className="sidebar-nav">
        <span className="nav-section">Menú</span>
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => setPage(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
