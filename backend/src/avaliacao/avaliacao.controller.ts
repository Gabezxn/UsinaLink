import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AvaliacaoService } from './avaliacao.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { ResponderAvaliacaoDto } from './dto/responder-avaliacao.dto';
import { UpdateAvaliacaoDto } from './dto/update-avaliacao.dto';

@Controller('api/avaliacoes')
export class AvaliacaoController {
  constructor(private readonly service: AvaliacaoService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateAvaliacaoDto, @Req() r: any) {
    return this.service.create(dto, r.user);
  }

  @Get('usina/:usinaId')
  findByUsina(@Param('usinaId') usinaId: string) {
    return this.service.findByUsina(+usinaId);
  }

  @Get('empresa/:empresaId')
  findByEmpresa(@Param('empresaId') empresaId: string) {
    return this.service.findByEmpresa(+empresaId);
  }

  @Get('pedido/:pedidoId')
  findByPedido(@Param('pedidoId') pedidoId: string) {
    return this.service.findByPedido(+pedidoId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAvaliacaoDto, @Req() r: any) {
    return this.service.update(+id, dto, r.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/resposta')
  answer(@Param('id') id: string, @Body() dto: ResponderAvaliacaoDto, @Req() r: any) {
    return this.service.answer(+id, dto, r.user);
  }

  @Get('usina/:usinaId/resumo')
  summary(@Param('usinaId') usinaId: string) {
    return this.service.summary(+usinaId);
  }
}
