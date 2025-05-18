import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Empresa)
    private empresaRepo: Repository<Empresa>,
    @InjectRepository(Usuario)
    private userRepo: Repository<Usuario>,
  ) {}

  async getEmpresas({
    query,
    loggedUserId,
    page = 1,
    limit = 10,
  }: {
    query?: string;
    loggedUserId: number;
    page?: number;
    limit?: number;
  }) {
    const user = await this.userRepo.findOne({ where: { id: loggedUserId } });

    if (!user?.isSuperAdmin) {
      throw new BadRequestException('Invalid roles');
    }

    const qb = this.empresaRepo
      .createQueryBuilder('empresa')
      .leftJoinAndSelect('empresa.payment', 'payment')
      .orderBy('empresa.createdAt', 'DESC');

    if (query) {
      const searchableFields = [
        'empresa.nombre',
        'empresa.db_name',
        'empresa.descripcion',
        'empresa.greenApiInstance',
        'empresa.greenApiInstanceToken',
        'empresa.direccion',
      ];

      const conditions = searchableFields
        .map((field) => `${field} ILIKE :query`)
        .join(' OR ');

      qb.where(conditions, { query: `%${query}%` });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const allEmpresas = await Promise.all(
      data.map(async (empresa) => {
        let greenApiConfigured = false;
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

        return {
          ...empresa,
          greenApiConfigured: greenApiConfigured,
          userConfigured: true,
          apiConfigured: empresa.apiConfigured,
          isPaymentActive: empresa?.payment
            ? empresa?.payment?.isActive()
            : false,
        };
      }),
    );

    return {
      data: allEmpresas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deploy(empresaId: any, loggedUserId: number) {
    const user = await this.userRepo.findOne({ where: { id: loggedUserId } });
    if (!user?.isSuperAdmin) {
      throw new BadRequestException('Invalid roles');
    }
    const empresa = await this.empresaRepo.findOne({ where: { id: empresaId  } });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }

    const owner = 'maxioliverasilva13';
    const repo = 'proyectoWhatsapp';
    const workflow_id = 'deployManualCompany.yml';
    const ref = 'qa';
    const githubToken = process.env.TOKEN_CONNECT_GIT;

    if (!githubToken) {
      throw new BadRequestException('Token de GitHub no configurado');
    }

    const body = {
      ref,
      inputs: {
        empresa_db_name: empresa?.db_name,
      },
    };

    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.status !== 204) {
      const errorBody = await response.text();
      throw new BadRequestException(
        `Error disparando workflow: ${response.status} ${errorBody}`,
      );
    }

    return { message: `Workflow disparado con db_name: ${empresa?.db_name}` };
  }
}
