import { TipoPedido } from "src/enums/tipopedido";

export class CreatePedidoDto {
    confirmado: boolean;
    clienteId:number;
    estadoId:number;
    clientName: string
    products:any[];
    empresaType: TipoPedido;
    numberSender? : number;
    infoLinesJson: any;
    userId?: string;
    fecha?: any;
    transferUrl?: any;
    isDomicilio?: boolean;
    paymentMethodId?: string;
    withIA?: boolean;
    originalChatId?: string;
    detalles?: string;
    messageToUser?: string;
    espacio_id?: number;
    chatId : string;
    timeZone: string;
}
