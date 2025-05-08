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

export const SendRemainders = async (deviceService: DeviceService) => {
  const connection = await handleGetCurrentConnection();
  try {
    const globalConnection = await handleGetGlobalConnection();

    const pedidoRepo = connection.getRepository(Pedido);
    const clienteRepo = globalConnection.getRepository(Cliente);
    const prodPedido = connection.getRepository(ProductoPedido);
    const empresaRepo = globalConnection.getRepository(Empresa);
    const usuarioRepo = globalConnection.getRepository(Usuario);

    const currentEmpresa = await empresaRepo.findOne({
      where: { db_name: process.env.SUBDOMAIN },
    });
    if (!currentEmpresa || !currentEmpresa.notificarReservaHoras) {
      return;
    }

    const usuariosEmpresa = await usuarioRepo.find({
      where: { id_empresa: currentEmpresa?.id },
    });

    const hoursRemainder = currentEmpresa.remaindersHorsRemainder;

    const pedidos = await connection.query(`SELECT * FROM pedido
        WHERE confirmado = true
        AND fecha >= CURRENT_TIMESTAMP 
        AND fecha <= CURRENT_TIMESTAMP + INTERVAL '${hoursRemainder} hours';`);

    if (pedidos.length === 0 || usuariosEmpresa?.length === 0) {
      return;
    }

    for (const pedido of pedidos as Pedido[]) {
      const cliente = await clienteRepo.findOne({
        where: { id: pedido?.cliente_id },
      });
      const citaHora = moment()
        .add(hoursRemainder, 'hours')
        .format('YYYY-MM-DD HH:mm');
      const products = await prodPedido.find({
        where: { pedidoId: pedido.id },
      });
      if (cliente) {
        let services = null;
        if (products?.length > 0) {
          services = products
            ?.map((prod) => prod?.producto?.nombre)
            ?.join(', ');
        }
        const message = generateMessage(citaHora, hoursRemainder);
        await Promise.all(
          usuariosEmpresa?.map(async (user) => {
            await deviceService.sendNotificationUser(
              user?.id,
              `Recordatorio`,
              message,
            );
          }),
        );
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

function generateMessage(citaHora, hoursRemainder) {
  const cita = moment(citaHora);
  if (hoursRemainder < 24) {
    return `Hola, no olvides tu cita para hoy a las ${cita.format('HH:mm')}`;
  } else if (hoursRemainder < 48) {
    return `Hola, no olvides tu cita para mañana a las ${cita.format('HH:mm')}`;
  } else {
    return `Hola, no olvides tu cita para el ${cita.format('dddd, MMMM Do YYYY [a las] HH:mm')}`;
  }
}
