import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import './index.css';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Facturas  from './pages/Facturas';
import Clientes  from './pages/Clientes';
import Empleados from './pages/Empleados';
import Config    from './pages/Config';

const PAGES = { dashboard: Dashboard, facturas: Facturas, clientes: Clientes, empleados: Empleados, config: Config };

export default function App() {
  const [page, setPage] = useState('dashboard');
  const Page = PAGES[page] || Dashboard;

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} />
      <main className="main-content">
        <Page />
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' },
          success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--surface)' } },
          error:   { iconTheme: { primary: 'var(--red)',   secondary: 'var(--surface)' } },
        }}
      />
    </div>
  );
}
