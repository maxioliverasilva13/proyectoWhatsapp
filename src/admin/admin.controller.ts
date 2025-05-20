import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/empresas')
  findAll(
    @Query('query') query: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() request: any,
  ) {
    const loggedUserId = request?.user?.userId;
    return this.adminService.getEmpresas({
      query: query,
      page: page,
      limit: limit,
      loggedUserId: loggedUserId,
    });
  }

  @Post('deploy/:id')
  deployEmpresa(@Req() request: any, @Param('id') id: string) {
    const loggedUserId = request?.user?.userId;
    return this.adminService.deploy(id, loggedUserId);
  }

  @Patch('/empresa/:id')
  updateEmpresa(
    @Req() request: any,
    @Param('id') empresaId: string,
    @Body() data,
  ) {
    const loggedUserId = request?.user?.userId;
    return this.adminService.update(empresaId, data, loggedUserId);
  }
}
