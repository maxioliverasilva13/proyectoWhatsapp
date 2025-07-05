import { MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import {
  handleGetCurrentConnection,
  handleGetGlobalConnection,
} from '../dbConnection';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Cliente } from 'src/cliente/entities/cliente.entity';
import * as moment from 'moment';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { DeviceService } from 'src/device/device.service';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { TIPO_SERVICIO_DELIVERY_ID, TIPO_SERVICIO_RESERVA_ID } from 'src/database/seeders/app/tipopedido.seed';

export const SendRemainders = async (
  deviceService: DeviceService,
  messageQueue: any,
) => {
  const connection = await handleGetCurrentConnection();
  try {
    console.log('intentando enviar recordatorios');
    const globalConnection = await handleGetGlobalConnection();

    const pedidoRepo = connection.getRepository(Pedido);
    const clienteRepo = connection.getRepository(Cliente);
    const prodPedido = connection.getRepository(ProductoPedido);
    const empresaRepo = globalConnection.getRepository(Empresa);
    const usuarioRepo = globalConnection.getRepository(Usuario);

    const currentEmpresa = await empresaRepo.findOne({
      where: { db_name: process.env.SUBDOMAIN },
      relations: ['tipoServicioId']
    });
    if (!currentEmpresa || !currentEmpresa.notificarReservaHoras || currentEmpresa?.tipoServicioId?.id === TIPO_SERVICIO_DELIVERY_ID) {
      return;
    }

    const usuariosEmpresa = await usuarioRepo.find({
      where: { id_empresa: currentEmpresa?.id },
    });

    const hoursRemainder = currentEmpresa.remaindersHorsRemainder;

    const localNow = moment().subtract(3, 'hours');
    const localMax = localNow.clone().add(hoursRemainder, 'hours');

    const nowUtc = localNow.clone().utc();
    const maxDateUtc = localMax.clone().utc();

    const pedidos = await pedidoRepo
      .createQueryBuilder('pedido')
      .where('pedido.confirmado = :confirmado', { confirmado: true })
      .where('pedido.withIA = :withIA', { withIA: true })
      .andWhere('pedido.notified = :notified', { notified: false })
      .andWhere('pedido.fecha >= :desde', { desde: nowUtc.toDate() })
      .andWhere('pedido.fecha <= :hasta', { hasta: maxDateUtc.toDate() })
      .getMany();

    console.log('intentando notificar ', pedidos);

    if (pedidos.length === 0 || usuariosEmpresa?.length === 0) {
      return;
    }

    for (const pedido of pedidos) {
      const cliente = await clienteRepo.findOne({
        where: { id: pedido?.cliente_id },
      });

      const citaHora = moment(pedido.fecha).format('YYYY-MM-DD HH:mm');

      const products = await prodPedido.find({
        where: { pedidoId: pedido.id },
        relations: ['producto'],
      });

      if (cliente) {
        let services = null;
        if (products?.length > 0) {
          services = products
            ?.map((prod) => prod?.producto?.nombre)
            ?.join(', ');
        }

        const message = generateMessage(
          citaHora,
          hoursRemainder,
          cliente?.nombre,
        );

        await messageQueue.add(
          'send',
          {
            message: { message },
            chatId: pedido?.chatIdWhatsapp,
          },
          {
            priority: 0,
            attempts: 5,
          },
        );

        pedido.notified = true;
        await pedidoRepo.save(pedido);
      } else {
        console.log('No client found');
      }
    }
  } catch (error) {
    console.error('Error en SendRemainders:', error);
  } finally {
    connection.destroy();
  }
};

function generateMessage(citaHora, hoursRemainder, clientName) {
  const cita = moment(citaHora);
  if (hoursRemainder < 24) {
    return `Hola ${clientName}, no olvides tu reserva para hoy a las ${cita.format('HH:mm')}`;
  } else if (hoursRemainder < 48) {
    return `Hola ${clientName}, no olvides tu reserva para mañana a las ${cita.format('HH:mm')}`;
  } else {
    return `Hola ${clientName}, no olvides tu reserva para el ${cita.format('dddd, MMMM Do YYYY [a las] HH:mm')}`;
  }
}
