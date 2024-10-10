import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Producto } from 'src/producto/entities/producto.entity';

export const ENTITIES_TO_MAP_GLOBAL_DB = [Empresa];

export const ENTITIES_TO_MAP_EMPRESA_DB = [Producto];

export const isDev = process.env.ENV == 'dev';
