import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PropostaService } from './proposta.service';
import { CreatePropostaDto } from './dto/create-proposta.dto';

@Controller('api/propostas')
@UseGuards(JwtAuthGuard)
export class PropostaController {
  constructor(private readonly service: PropostaService) {}
  @Post() criar(@Body() dto: CreatePropostaDto, @Req() r: any) { return this.service.criar(dto, r.user); }
  @Get('recebidas') recebidas(@Req() r: any) { return this.service.recebidas(r.user); }
  @Get('enviadas') enviadas(@Req() r: any) { return this.service.enviadas(r.user); }
  @Get(':id') detalhe(@Param('id') id: string, @Req() r: any) { return this.service.detalhe(id, r.user); }
  @Patch(':id/aceitar') aceitar(@Param('id') id: string, @Req() r: any) { return this.service.aceitar(id, r.user); }
  @Patch(':id/recusar') recusar(@Param('id') id: string, @Req() r: any) { return this.service.recusar(id, r.user); }
  @Patch(':id/cancelar') cancelar(@Param('id') id: string, @Req() r: any) { return this.service.cancelar(id, r.user); }
}
