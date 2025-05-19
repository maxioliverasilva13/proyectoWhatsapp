import {
  BadRequestException,
  HttpException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { RegisterDTO } from './dto/register.dto';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { EmailService } from 'src/emailqueue/email.service';
import * as moment from 'moment-timezone';
import { Currency } from 'src/currencies/entities/currency.entity';
import { EmailServiceResend } from 'src/emailServiceResend/email.service';

@Injectable()
export class AuthService implements OnModuleDestroy {
  private empresaRepository: Repository<Empresa>;
  private globalConnection: DataSource;

  async onModuleInit() {
    if (!this.globalConnection) {
      this.globalConnection = await handleGetGlobalConnection();
    }
    this.empresaRepository = this.globalConnection.getRepository(Empresa);
    this.empresaRepository = this.globalConnection.getRepository(Empresa);

  }

  async onModuleDestroy() {
    if (this.globalConnection && this.globalConnection.isInitialized) {
      await this.globalConnection.destroy();
    }
  }

  constructor(
    private jwtService: JwtService,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private readonly emailService: EmailService,
    private readonly emailServiceResend: EmailServiceResend
  ) { }

  async validateUser(correo: string, password: string): Promise<any> {
    const user = await this.usuarioRepository.findOne({ where: { correo } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Usuario) {
    const payload = {
      userId: user?.id,
      empresaId: user?.id_empresa,
      correo: user.correo,
      sub: user.id,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(userData: RegisterDTO) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.usuarioRepository.create({
      ...userData,
      activo: true,
      password: hashedPassword,
      id_rol: 2,
    });
    if (userData?.imagen) {
      user.image = userData?.imagen;
    }
    this.emailService.sendEmail(user.correo, 'Bienvenido', 'welcome');
    return this.usuarioRepository.save(user);
  }

  async currentUser(userId: any, timeZoneCompany: string) {
    const globalConnection = await handleGetGlobalConnection();

    try {
      const userRepository = globalConnection.getRepository(Usuario);
      const currencyRepository = globalConnection.getRepository(Currency);

      const now = moment.tz(timeZoneCompany);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['dispositivos'],
      });
      if (!user) {
        throw new HttpException('Invalid user', 400);
      }

      let currencies = [];
      let remaindersHorsRemainder;
      let notificarReservaHoras;
      let intervaloTiempoCalendario;
      let userConfigured = !!user.nombre?.trim() && !!user.apellido?.trim();
      let apiConfigured;
      let paymentMade = false;
      let payment = null;
      let oldPlan = null;
      let apiUrl = '';
      let assistentEnabled = false;
      let greenApiConfigured = false;
      let tipo_servicio = 0;
      let tipo_servicioNombre = '';
      let hora_apertura;
      let empresaName = '';
      ``;
      let maxPedidos = 0;
      let hora_cierre;
      let abierto;
      let timeZone;
      let logo;
      let currentPedidos = 0;

      if (user.id_empresa) {
        const allCurrencies = await currencyRepository
          .createQueryBuilder('currency')
          .leftJoinAndSelect('currency.empresa', 'empresa')
          .where('empresa.id = :empresaId OR currency.empresa IS NULL', {
            empresaId: user?.id_empresa,
          })
          .getMany();

        currencies = allCurrencies ?? [];

        const empresa = await this.empresaRepository.findOne({
          where: { id: user.id_empresa },
          relations: ['tipoServicioId', 'currencies', 'payment', 'payment.plan'],
        });
        if (empresa) {

          logo = empresa.logo ?? 'No logo';
          hora_apertura = empresa.hora_apertura;
          hora_cierre = empresa.hora_cierre;
          assistentEnabled = empresa?.assistentEnabled;
          abierto = empresa.abierto;
          maxPedidos = empresa?.payment?.plan?.maxPedidos ?? 0;
          tipo_servicio = empresa?.tipoServicioId?.id;
          tipo_servicioNombre = empresa.tipoServicioId.nombre;
          empresaName = empresa?.nombre;
          intervaloTiempoCalendario = empresa.intervaloTiempoCalendario;
          notificarReservaHoras = empresa.notificarReservaHoras;
          remaindersHorsRemainder = empresa.remaindersHorsRemainder;
          payment = empresa.payment;
          timeZone = empresa.timeZone;
          apiConfigured = empresa.apiConfigured;
          apiUrl = `${process.env.ENV === 'dev' ? 'http' : 'https'}://${process.env.VIRTUAL_HOST?.replace(
            'app',
            empresa?.db_name,
          )}`;

          if (empresa.greenApiInstance && empresa.greenApiInstanceToken) {
            const res = await fetch(
              `https://api.green-api.com/waInstance${empresa.greenApiInstance}/getStateInstance/${empresa.greenApiInstanceToken}`,
            );
            try {
              const resFormated = await res.json();

              greenApiConfigured = resFormated.stateInstance === 'authorized';
            } catch (error) {
              greenApiConfigured = false;
              console.log(error);
            }
          }

          if (empresa.payment) {
            paymentMade = empresa.payment.isActive();
            payment.isActive = empresa.payment.isActive();
          }
        }
      }

      const newUser = { ...user };
      delete newUser.password;
      return {
        ...newUser,
        apiUrl: apiUrl,
        apiConfigured,
        tipo_servicio,
        tipo_servicioNombre,
        paymentMade,
        userConfigured,
        maxPedidos: maxPedidos,
        currentPedidos: currentPedidos,
        payment: payment,
        greenApiConfigured,
        globalConfig:
          greenApiConfigured && userConfigured && paymentMade && apiConfigured,
        intervaloTiempoCalendario,
        notificarReservaHoras,
        hora_apertura,
        isAdmin: user.isAdmin,
        hora_cierre,
        abierto,
        empresaName: empresaName,
        remaindersHorsRemainder,
        timeZone,
        oldPlan: oldPlan,
        assistentEnabled: assistentEnabled,
        currencies: currencies,
        logo: logo,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al obtener el numero',
        error: 'Bad Request',
      });
    } finally {
      globalConnection.destroy();
    }
  }

  async sendLinkToResetPassword(userEmail: string) {

    try {
      const globalConnection = await handleGetGlobalConnection();
      const userRepository = globalConnection.getRepository(Usuario);

      const user = await userRepository.findOne({ where: { correo: userEmail } });
      if (!user) {
        throw new HttpException('Invalid user', 400);
      }

      const payload = {
        userId: user?.id,
        empresaId: user?.id_empresa,
        correo: user.correo,
        sub: user.id,
      };

      const access_token = this.jwtService.sign(payload)

      await this.emailServiceResend.sendVerificationCodeEmail(user.correo, access_token)

      return {
        ok: true,
        message: 'Hemos enviado un correo para recuperar tu cuenta!',
      };

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error inesperado',
        error: 'Bad Request',
      });
    }
  }

  async resetPassword(userEmail: string, newPassword: any) {
    try {
      const globalConnection = await handleGetGlobalConnection();
      const userRepository = globalConnection.getRepository(Usuario);

      const user = await userRepository.findOne({ where: { correo: userEmail } });
      if (!user) {
        throw new HttpException('Invalid user', 400);
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = newPassword

      await this.usuarioRepository.save(user)

      return {
        ok: true,
        message: 'La password se restablecio correctamente',
      };

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error inesperado',
        error: 'Bad Request',
      });
    }
  }
}
