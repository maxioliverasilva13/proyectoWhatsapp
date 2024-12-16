export class CreatePedidoDto {
    confirmado: boolean;
    tipo_servicioId: number;
    clienteId:number;
    estadoId:number;
    responseJSON: string;
    products:any[];
    empresaType: string;
    messages: any[];
}
