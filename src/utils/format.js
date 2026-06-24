import dayjs from 'dayjs';
import 'dayjs/locale/es-mx';
dayjs.locale('es-mx');

export const fmtMoney = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n ?? 0);

export const fmtDate = (d) => dayjs(d).format('DD MMM YYYY');

export const fmtPct = (n) => `${((n ?? 0) * 100).toFixed(2)}%`;

export const TIPO_LABELS = { deposito: 'Depósito', cargo: 'Cargo' };

export const SUBTIPO_LABELS = {
  honorarios: 'Honorarios',
  comisiones_por_venta: 'Comisiones por venta',
  pautas: 'Pautas',
  nomina: 'Nómina',
  licencia: 'Licencia',
  servicio: 'Servicio',
};

export const ESTATUS_CONFIG = {
  pendiente:   { label: 'Pendiente',   cls: 'badge-amber' },
  confirmado:  { label: 'Confirmado',  cls: 'badge-green' },
  cancelado:   { label: 'Cancelado',   cls: 'badge-red'   },
};

export const SUBTIPOS_POR_TIPO = {
  deposito: [
    { value: 'honorarios',          label: 'Honorarios' },
    { value: 'comisiones_por_venta',label: 'Comisiones por venta' },
    { value: 'pautas',              label: 'Pautas' },
  ],
  cargo: [
    { value: 'nomina',    label: 'Nómina' },
    { value: 'licencia',  label: 'Licencia' },
    { value: 'servicio',  label: 'Servicio' },
  ],
};
