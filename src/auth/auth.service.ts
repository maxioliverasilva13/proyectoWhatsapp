import { BadRequestException, HttpException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { RegisterDTO } from './dto/register.dto';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { EmailService } from 'src/emailqueue/email.service';
import { Plan } from 'src/plan/entities/plan.entity';
import { PlanEmpresa } from 'src/planEmpresa/entities/planEmpresa.entity';
import * as moment from 'moment-timezone';
import { Currency } from 'src/currencies/entities/currency.entity';

@Injectable()
export class AuthService implements OnModuleDestroy {
  private empresaRepository: Repository<Empresa>;
  private planesRepository: Repository<Plan>;
  private planesEmpresaRepository: Repository<PlanEmpresa>;
  private globalConnection: DataSource;

  async onModuleInit() {
    if (!this.globalConnection) {
      this.globalConnection = await handleGetGlobalConnection();
    }
    this.empresaRepository = this.globalConnection.getRepository(Empresa);
    this.planesEmpresaRepository = this.globalConnection.getRepository(PlanEmpresa);
    this.planesRepository = this.globalConnection.getRepository(Plan);
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
  ) {}

  async validateUser(correo: string, password: string): Promise<any> {
    const user = await this.usuarioRepository.findOne({ where: { correo } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: Usuario) {
    const payload = { userId: user?.id, empresaId: user?.id_empresa, correo: user.correo, sub: user.id };
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
      const user = await userRepository.findOne({ where: { id: userId }, relations: ['dispositivo'] });
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
      let apiUrl = '';
      let greenApiConfigured = false;
      let tipo_servicio = 0;
      let tipo_servicioNombre = '';
      let hora_apertura;
      let empresaName = "";``
      let hora_cierre;
      let abierto;
      let timeZone;

      if (user.id_empresa) {
        const allCurrencies = await currencyRepository
        .createQueryBuilder("currency")
        .leftJoinAndSelect("currency.empresa", "empresa")
        .where("empresa.id = :empresaId OR currency.empresa IS NULL", { empresaId: user?.id_empresa })
        .getMany();

        currencies = allCurrencies ?? [];

        const empresa = await this.empresaRepository.findOne({
          where: { id: user.id_empresa },
          relations: ['tipoServicioId', 'currencies'],
        });
        if (empresa) {
          hora_apertura = empresa.hora_apertura;
          hora_cierre = empresa.hora_cierre;
          abierto = empresa.abierto;
          tipo_servicio = empresa?.tipoServicioId?.id;
          tipo_servicioNombre = empresa.tipoServicioId.nombre;
          empresaName = empresa?.nombre;
          intervaloTiempoCalendario = empresa.intervaloTiempoCalendario;
          notificarReservaHoras = empresa.notificarReservaHoras;
          remaindersHorsRemainder = empresa.remaindersHorsRemainder;
          
          timeZone = empresa.timeZone
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

          const lastPlan = await this.planesEmpresaRepository.findOne({
            where: { id_empresa: empresa?.id },
            order: { fecha_inicio: 'DESC' },
          });

          if (lastPlan) {
            const plan = await this.planesRepository.findOne({ where: { id: lastPlan.id_plan } });

            const planExpiryDate = moment.tz(lastPlan.fecha_inicio, timeZoneCompany).add(plan.diasDuracion, 'days');

            paymentMade = now.isSameOrBefore(planExpiryDate);
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
        greenApiConfigured,
        globalConfig: greenApiConfigured && userConfigured && paymentMade && apiConfigured,
        intervaloTiempoCalendario,
        notificarReservaHoras,
        hora_apertura,
        hora_cierre,
        abierto,
        empresaName: empresaName,
        remaindersHorsRemainder,
        timeZone,
        currencies: currencies
      };
    } catch (error) {
      console.log(error)
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

  async resetPassword(userEmail: string) {
    const globalConnection = await handleGetGlobalConnection();
    const userRepository = globalConnection.getRepository(Usuario);

    const user = await userRepository.findOne({ where: { correo: userEmail } });
    if (!user) {
      throw new HttpException('Invalid user', 400);
    }
    return {
      ok: true,
      message: 'La password se restablecio correctamente, chequea el email',
    };
  }
}
