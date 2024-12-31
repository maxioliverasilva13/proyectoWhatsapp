import { TipoPedido } from "src/enums/tipopedido";

export class CreatePedidoDto {
    confirmado: boolean;
    clienteId:number;
    estadoId:number;
    clientName: string
    responseJSON: string;
    products:any[];
    empresaType: TipoPedido;
    messages: any[];
    numberSender : number;
    infoLinesJson: any
}
