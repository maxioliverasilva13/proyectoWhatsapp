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
    fecha?: any;
    withIA?: boolean;
    originalChatId?: string;
    detalles?: string;
    messageToUser?: string;
    chatId : string
}
