export class ProductoPedidoDto {
    pedidoId: number;
    productoId:number;
    cantidad: number;
    infoLinesJson: string;
    detalle: string | null;
}