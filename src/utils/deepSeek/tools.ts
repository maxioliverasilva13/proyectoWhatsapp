export const Customtools = (empresaType: string) => {
    const isReserva = empresaType === 'RESERVAS DE ESPACIO';

    const confirmOrderInfoProperties: any = {
        fecha: {
            type: "string",
            format: "date",
            description: "Fecha de confirmación del pedido en formato YYYY-MM-DD HH:mm"
        },
        messageToUser: {
            type: "string",
            description: "Mensaje de confirmación que se le enviará al usuario"
        },
        infoLines: {
            type: "object",
            additionalProperties: {
                type: "string"
            },
            description: "Líneas informativas adicionales, como dirección u otros datos"
        },
        detalles: {
            type: "string",
            description: "Detalles específicos proporcionados por el usuario sobre la orden, es MUY importante captar lo que el usuario quiere"
        },
        data: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    productoId: {
                        type: "number",
                        description: "ID del producto solicitado"
                    },
                    fecha: {
                        type: "string",
                        format: "date",
                        description: "Fecha específica de este producto dentro del pedido"
                    },
                    cantidad: {
                        type: "number",
                        description: "Cantidad del producto solicitado"
                    }
                },
                required: ["productoId", "cantidad"]
            },
            description: "Listado de productos en la orden"
        }
    };

    const confirmOrderInfoRequired = [
        "fecha",
        "messageToUser",
        "infoLines",
        "data"
    ];

    if (isReserva) {
        confirmOrderInfoProperties.espacio_id = {
            type: "string",
            description: "Id del espacio al cual crearemos la reserva"
        };
        confirmOrderInfoRequired.push("espacio_id");
    } else {
        confirmOrderInfoProperties.empleadoId = {
            type: "string",
            description: "Id del empleado que va a atender, solo si la empresa es de tipo Reserva"
        };
        confirmOrderInfoRequired.push("empleadoId");
    }

    const getAvailabilityProperties: any = {
        date: {
            type: "string",
            description: "fecha a chequear la disponibilidad, solo fecha, en formato YY:MM:DD"
        }
    };

    if (isReserva) {
        getAvailabilityProperties.espacio_id = {
            type: "string",
            description: "Id del espacio al cual consultaremos la disponibilidad"
        };
    } else {
        getAvailabilityProperties.empleadoId = {
            type: "string",
            description: "Id del empleado (solo si la empresa es de tipo reserva)"
        };
    }

    return [
        {
            type: "function",
            function: {
                name: "getAvailability",
                description: "Busca un conjunto de disponibilidades para hacer una reserva en base a cierta fecha",
                parameters: {
                    type: "object",
                    properties: getAvailabilityProperties,
                    required: ["date"]
                }
            }
        },

        {
            type: "function",
            function: {
                name: "confirmOrder",
                description: "Confirma una orden o reserva de productos con la información proporcionada por el usuario",
                parameters: {
                    type: "object",
                    properties: {
                        info: {
                            type: "object",
                            properties: confirmOrderInfoProperties,
                            required: confirmOrderInfoRequired
                        },
                        messagePushTitle: {
                            type: "string",
                            description: "Título de la notificación push para esta orden"
                        },
                        transferUrl: {
                            type: "string",
                            description: "Url de la imagen de la transferencia (Opcional)"
                        },
                        messagePush: {
                            type: "string",
                            description: "Mensaje descriptivo de la notificación push para esta orden"
                        },
                        detalles: {
                            type: "string",
                            description: "Detalles generales del pedido"
                        },
                        paymentMethodId: {
                            type: "string",
                            description: "ID de el metodo de pago elejido por el usuario en caso de ser proporcionado"
                        }
                    },
                    required: ["info", "messagePushTitle", "messagePush"]
                }
            }
        },
        {
            "type": "function",
            "function": {

                "name": "editOrder",
                "description": "Permite editar una orden/pedido/reserva",

                "parameters": {
                    "type": "object",
                    "properties": {
                        "orderId": {
                            "type": "string",
                            "description": "Id de la orden que el usuario desda modfiicar"
                        },
                        "order": {
                            "type": "object",
                            "description": "El objeto original de la orden que el usuario halla modificado, pero con la informacion que el usuario cambio, modificada, ya sea en los detalles, fecha, en los info line, etc."
                        }
                    },
                    "required": [
                        "orderId",
                        "order"
                    ]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "getInfoLines",
                "description": "Busca los INFO-LINES items de la empresa actual, los info lines son los datos que se requieren para hacer una orden/pedido/reserva",

                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "cancelOrder",
                "description": "Permite cancelar una orden/pedido/reserva",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "orderId": {
                            "type": "string",
                            "description": "Id de la orden que el usuario desda eliminar"
                        }
                    },
                    "required": [
                        "orderId"
                    ]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "createReclamo",
                "description": "Crea un reclamo para cierto pedido/reserva especificado por el usuario",

                "parameters": {
                    "type": "object",
                    "properties": {
                        "pedidoId": {
                            "type": "string",
                            "description": "Id de la orden/pedido/reserva a reclamar"
                        },
                        "reclamoText": {
                            "type": "string",
                            "description": "El reclamo indicado por el ususario"
                        }
                    },
                    "required": [
                        "pedidoId",
                        "reclamoText"
                    ]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "getPaymentMethods",
                "description": "Busca la lista de metodos de pago aceptados por la empresa actual",

                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        }
    ]
}