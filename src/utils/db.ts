import { Empresa } from "src/empresa/entities/empresa.entity";
import { Producto } from "src/producto/entities/producto.entity";
import * as process from "process";
import { Plan } from "src/plan/entities/plan.entity";
import { Tiposervicio } from "src/tiposervicio/entities/tiposervicio.entity";
import { Role } from "src/roles/entities/role.entity";
import { Cliente } from "src/cliente/entities/cliente.entity";
import { Usuario } from "src/usuario/entities/usuario.entity";
import { Pedido } from "src/pedido/entities/pedido.entity";
import { Cambioestadopedido } from "src/cambioestadopedido/entities/cambioestadopedido.entity";
import { Chat } from "src/chat/entities/chat.entity";
import { Estado } from "src/estado/entities/estado.entity";
import { Mensaje } from "src/mensaje/entities/mensaje.entity";
import { ProductoPedido } from "src/productopedido/entities/productopedido.entity";
import { ChatGptThreads } from "src/chatGptThreads/entities/chatGpThreads.entity";
import { NumeroConfianza } from "src/numerosConfianza/entities/numeroConfianza.entity";
import { CierreProvisorio } from "src/cierreProvisorio/entities/cierreProvisorio.entitty";
import { Infoline } from "src/infoline/entities/infoline.entity";
import { Currency } from "src/currencies/entities/currency.entity";
import { Category } from "src/category/entities/category.entity";
import { Device } from "src/device/device.entity";
import { Payment } from "src/payments/payment.entity";
import { Reclamo } from "src/pedido/entities/reclamo.entity";
import { PaymentMethod } from "src/paymentMethod/entities/paymentMethod.entity";
import { Horario } from "src/horario/entities/horario.entity";
import { MenuImage } from "src/menuImg/entities/menu";
import { Espacio } from "src/espacio/entities/espacio";
import { Precio } from "src/espacio/entities/precio";

export const ENTITIES_TO_MAP_GLOBAL_DB = [
  Plan,
  Empresa,
  Currency,
  CierreProvisorio,
  Tiposervicio,
  Role,
  Usuario,
  NumeroConfianza,
  Device,
  Payment
];

export const ENTITIES_TO_MAP_EMPRESA_DB = [
  Producto,
  PaymentMethod,
  Pedido,
  Cambioestadopedido,
  Chat,
  ProductoPedido,
  Estado,
  Mensaje,
  Horario,
  ChatGptThreads,
  Infoline,
  Category,
  Cliente,
  Reclamo,
  MenuImage,
  Espacio,
  Precio
];

export const SEEDERS_TO_MAP_GLOBAL_DB = 'src/database/seeders/app/*{.ts,.js}'

export const SEEDERS_TO_MAP_EMPRESA = 'src/database/seeders/empresa/*{.ts,.js}'

export const isDev = process.env.ENV == "dev";
