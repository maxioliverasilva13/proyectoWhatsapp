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


export const ENTITIES_TO_MAP_GLOBAL_DB = [
  Plan,
  Empresa,
  Tiposervicio,
  Role,
  Cliente,
  Usuario,
];

export const ENTITIES_TO_MAP_EMPRESA_DB = [
  Producto,
  Pedido,
  Cambioestadopedido,
  Chat,
  ProductoPedido,
  Estado,
  Mensaje,
  ChatGptThreads
];

export const isDev = process.env.ENV == "dev";
