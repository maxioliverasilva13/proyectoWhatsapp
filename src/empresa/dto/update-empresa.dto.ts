import { PartialType } from '@nestjs/mapped-types';
import { CreateEmpresaDto } from './create-empresa.dto';

export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {
    apiConfigured?: boolean;
    greenApiConfigured?: boolean;
    greenApiInstance?: string;
    greenApiInstanceToken? : string;
    abierto: boolean;
    intervaloTiempoCalendario: number;
    notificarReservaHoras: boolean;
    remaindersHorsRemainder: number
}

