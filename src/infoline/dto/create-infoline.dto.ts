import { TipoInfoLine } from "src/enums/tipoInfoLine";

export class CreateInfolineDto {
    nombre: string;
    requerido: boolean;
    es_defecto: boolean;
    id_tipo_servicio: number;
    tipo: TipoInfoLine;
}
