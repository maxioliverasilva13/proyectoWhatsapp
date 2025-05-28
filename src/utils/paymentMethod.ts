export const ID_PAYMENT_METHOD_TRANSFER = 1;
export const ID_PAYMENT_METHOD_CASH = 2;
export const ID_PAYMENT_METHOD_CARD_POS = 3;

export const defaultPaymentMethods = [
    {
        id: ID_PAYMENT_METHOD_TRANSFER,
        name: 'Transferencia bancaria',
        description: 'Pago mediante transferencia desde una cuenta bancaria.',
        specifications: 'Se debe enviar el comprobante de la transferencia por whatsapp(captura).',
        enabled: true,
    },
    {
        id: ID_PAYMENT_METHOD_CASH,
        name: 'Efectivo',
        description: 'Pago en efectivo al momento de la entrega o en el local.',
        specifications: 'Solo disponible para entregas locales o retiro en tienda.',
        enabled: true,
    },
    {
        id: ID_PAYMENT_METHOD_CARD_POS,
        name: 'POS / Tarjeta',
        description: 'Pago con tarjeta de crédito o débito mediante terminal POS al momento de entrega o en el local.',
        specifications: 'Se aceptan todas las tarjetas.',
        enabled: true,
    }
]


