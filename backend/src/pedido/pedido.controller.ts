import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';

@Controller('api/pedidos')
@UseGuards(JwtAuthGuard)
export class PedidoController {
  constructor(private readonly service: PedidoService) {}
  @Post() criar(@Body() dto: CreatePedidoDto, @Req() r: any) { return this.service.criar(dto, r.user); }
  @Get('meus') meus(@Req() r: any) { return this.service.meus(r.user); }
  @Get('disponiveis') disponiveis() { return this.service.disponiveis(); }
  @Get(':id') detalhe(@Param('id') id: string, @Req() r: any) { return this.service.detalhe(id, r.user); }
  @Patch(':id') atualizar(@Param('id') id: string, @Body() dto: UpdatePedidoDto, @Req() r: any) { return this.service.atualizar(id, dto, r.user); }
  @Patch(':id/cancelar') cancelar(@Param('id') id: string, @Req() r: any) { return this.service.cancelar(id, r.user); }
}
