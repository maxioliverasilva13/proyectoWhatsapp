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
    page;
    limit;
    return this.adminService.getEmpresas({
      query: query,
      page: page,
      limit: limit,
      loggedUserId: loggedUserId,
    });
  }

  @Post(':id')
  update(@Param('id') id: string) {
    // return this.clienteService.update(+id, updateClienteDto);
  }
}
