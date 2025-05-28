import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: any, ...args: any[]) {
        console.log('client connected');

    }

    handleDisconnect(client: any) {
        console.log('client dissconected');
    }

    @SubscribeMessage('greenApiStatus')
    async sendGreenApiStatus() {
        const greenApiStatus = { status: true, timestamp: new Date() };

        this.server.emit('greenApiStatusResponse', greenApiStatus);
    }

    @SubscribeMessage('listenChangeOrder')
    async listenChangeInOrder(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { orderId: number }
    ) {
        const channelName = 'order_listen_nro_' + payload.orderId
        console.log(channelName);


        if (payload.orderId) {
            client.join(channelName)
        }
    }

    async emitNotificationChangeStatuss(data) {
        console.log('recibo', data);

        const channelName = 'order_listen_nro_' + data.pedido.id

        if (channelName && data) {
            this.server.to(channelName).emit('changeStatusOrder', data)
        }

    }

    @SubscribeMessage('sendOrder')
    async sendOrder(body: any) {
        this.server.emit('sendOrderRealTime', {
            ...body,
        });
    }
}   