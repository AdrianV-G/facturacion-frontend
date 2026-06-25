import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15000,
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Error de red';
    return Promise.reject(new Error(msg));
  }
);

export const getFacturas      = (params)    => api.get('/api/facturas', { params });
export const getFactura       = (id)        => api.get(`/api/facturas/${id}`);
export const createFactura    = (form)      => api.post('/api/facturas', form);
export const updateFactura    = (id, form)  => api.put(`/api/facturas/${id}`, form);
export const cancelarFactura  = (id)        => api.patch(`/api/facturas/${id}/cancelar`);
export const getResumen       = (params)    => api.get('/api/facturas/resumen/totales', { params });
export const getResumenFiscal = (params)    => api.get('/api/facturas/resumen/fiscal', { params });
export const getClientes      = (params)    => api.get('/api/clientes',  { params });
export const getProyectos     = (params)    => api.get('/api/proyectos', { params });
export const getEmpleados     = (params)    => api.get('/api/empleados', { params });
export const getConfigFiscal  = ()          => api.get('/api/config-fiscal');
export const updateConfigFiscal = (d)       => api.put('/api/config-fiscal', d);

export default api;
