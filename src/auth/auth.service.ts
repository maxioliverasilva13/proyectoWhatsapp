import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { RegisterDTO } from './dto/register.dto';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { EmailService } from 'src/emailqueue/email.service';
import { Plan } from 'src/plan/entities/plan.entity';
import { PlanEmpresa } from 'src/planEmpresa/entities/planEmpresa.entity';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';

@Injectable()
export class AuthService {
  private empresaRepository: Repository<Empresa>
  private planesRepository: Repository<Plan>
  private planesEmpresaRepository: Repository<PlanEmpresa>

  async onModuleInit() {
    const globalConnection = await handleGetGlobalConnection();
    this.empresaRepository = globalConnection.getRepository(Empresa);
    this.planesEmpresaRepository = globalConnection.getRepository(PlanEmpresa);
    this.planesRepository = globalConnection.getRepository(Plan);
  }

  constructor(
    private jwtService: JwtService,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private readonly emailService: EmailService
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
    const payload = { userId: user?.id, empresaId: user?.id_empresa, correo: user.correo, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(userData: RegisterDTO) {
    // TODO: check if empresa is valid

    // Chcek if rol is valid

    console.log(userData);

    // todo: user another DTO
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.usuarioRepository.create({
      ...userData,
      activo: true,
      password: hashedPassword,
      id_rol: 2
    });
    this.emailService.sendEmail(user.correo, "Bienvenido", 'welcome')
    // delete user.password;
    return this.usuarioRepository.save(user);
  }

  async currentUser(userId: any) {

    try {
      const globalConnection = await handleGetGlobalConnection();
      const userRepository = globalConnection.getRepository(Usuario);
      const now = new Date()
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new HttpException("Invalid user", 400);
      }
      let remaindersHorsRemainder;
      let notificarReserva ;
      let intervaloTiempoCalendario;
      let userConfigured = !!user.nombre?.trim() && !!user.apellido?.trim();
      let apiConfigured;
      let paymentMade = false;
      let apiUrl = "";
      let greenApiConfigured = false
      let tipo_servicio = 0;
      let tipo_servicioNombre = '';
      let hora_apertura ;
      let hora_cierre;
      let abierto;
      if (user.id_empresa) {
        const empresa = await this.empresaRepository.findOne({ where: { id: user.id_empresa }, relations: ['tipoServicioId'] });
        if (empresa) {
          
          hora_apertura = empresa.hora_apertura
          hora_cierre = empresa.hora_cierre
          abierto = empresa.abierto,
          tipo_servicio = empresa.tipoServicioId.id
          tipo_servicioNombre = empresa.tipoServicioId.nombre
          intervaloTiempoCalendario = empresa.intervaloTiempoCalendario
          notificarReserva = empresa.notificarReservaHoras 
          remaindersHorsRemainder = empresa.remaindersHorsRemainder

          apiConfigured = empresa.apiConfigured
          apiUrl = `${process.env.ENV === "dev" ? "http" : "https"}://${process.env.VIRTUAL_HOST?.replace("app", empresa?.db_name)}`

          if (empresa.greenApiInstance && empresa.greenApiInstanceToken) {
            const res = await fetch(`https://api.green-api.com/waInstance${empresa.greenApiInstance}/getStateInstance/${empresa.greenApiInstanceToken}`)
            const resFormated = await res.json()

            greenApiConfigured = resFormated.stateInstance === 'authorized'
          }

          const lastPlan = await this.planesEmpresaRepository.findOne({
            where: { id_empresa: empresa.id },
            order: { fecha_inicio: "DESC" },
          });

          if (lastPlan) {
            const plan = await this.planesRepository.findOne({ where: { id: lastPlan.id_plan } })

            const planExpiryDate = new Date(lastPlan.fecha_inicio);
            planExpiryDate.setDate(planExpiryDate.getDate() + plan.diasDuracion);

            paymentMade = now <= planExpiryDate;
          }
        }
      }
      
      const newUser = { ...user }
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
        notificarReserva,
        hora_apertura,
        hora_cierre,
        abierto,
        remaindersHorsRemainder
      }
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al obtener el numero',
        error: 'Bad Request',
      });
    }
  }

  async resetPassword(userEmail: string) {
    const globalConnection = await handleGetGlobalConnection();
    const userRepository = globalConnection.getRepository(Usuario);

    const user = await userRepository.findOne({ where: { correo: userEmail } });
    if (!user) {
      throw new HttpException("Invalid user", 400);
    }
    // send mail to reset password
    return {
      ok: true,
      message: "La password se restablecio correctamente, chequea el email",
    }
  }
}
