import { TipoInfoLine } from "src/enums/tipoInfoLine";

export const NOMBRE_INFOLINE_DELIVERY = 1;
export const DIRECCION_INFOLINE_DELIVERY = 2;
export const NOMBRE_INFOLINE_RESERVA = 3;
export const FECHA_HORA_INFOLINE_RESERVA = 4;

export const defaultsInfoLineDelivery = [
  {
    id: DIRECCION_INFOLINE_DELIVERY,
    nombre: 'Direccion',
    requerido: true,
    es_defecto: true,
    tipo: TipoInfoLine.string,
    id_tipo_servicio: 1,
  },
];

export const defaultsInfoLineReservas = [
  {
    id: FECHA_HORA_INFOLINE_RESERVA,
    nombre: 'Fecha y Hora',
    requerido: true,
    es_defecto: true,
    tipo: TipoInfoLine.date,
    id_tipo_servicio: 2,
  },
];
