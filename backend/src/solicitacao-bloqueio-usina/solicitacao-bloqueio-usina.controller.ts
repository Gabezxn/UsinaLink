import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CreateSolicitacaoBloqueioUsinaDto } from './dto/create-solicitacao-bloqueio-usina.dto';
import { UpdateStatusSolicitacaoBloqueioDto } from './dto/update-status-solicitacao-bloqueio.dto';
import { SolicitacaoBloqueioUsinaService } from './solicitacao-bloqueio-usina.service';

@Controller('api/solicitacoes-bloqueio-usina')
@UseGuards(JwtAuthGuard)
export class SolicitacaoBloqueioUsinaController {
  constructor(private readonly service: SolicitacaoBloqueioUsinaService) {}

  @Post()
  create(@Body() dto: CreateSolicitacaoBloqueioUsinaDto, @Req() r: any) {
    return this.service.create(dto, r.user);
  }

  @Get('minhas')
  mine(@Req() r: any) {
    return this.service.findMine(r.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() r: any) {
    return this.service.findOne(+id, r.user);
  }

  @Patch(':id/cancelar')
  cancel(@Param('id') id: string, @Req() r: any) {
    return this.service.cancel(+id, r.user);
  }

  @UseGuards(AdminGuard)
  @Get('/admin/todas')
  adminFindAll() {
    return this.service.findAll();
  }

  @UseGuards(AdminGuard)
  @Patch('/admin/:id/status')
  adminUpdateStatus(@Param('id') id: string, @Body() dto: UpdateStatusSolicitacaoBloqueioDto, @Req() r: any) {
    return this.service.updateStatus(+id, dto, r.user);
  }
}
