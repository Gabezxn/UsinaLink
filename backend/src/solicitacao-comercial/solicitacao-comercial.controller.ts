import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SolicitacaoComercialService } from './solicitacao-comercial.service';
import { CreateSolicitacaoComercialDto } from './dto/create-solicitacao-comercial.dto';
import { AcaoCompraDto } from './dto/acao-compra.dto';

@Controller('api/solicitacoes-comerciais')
@UseGuards(JwtAuthGuard)
export class SolicitacaoComercialController {
  constructor(private readonly service: SolicitacaoComercialService) {}

  @Post()
  criar(@Body() dto: CreateSolicitacaoComercialDto, @Req() r: any) {
    return this.service.criar(dto, r.user);
  }

  @Get('recebidas')
  recebidas(@Req() r: any) {
    return this.service.recebidas(r.user);
  }

  @Get('minhas')
  minhas(@Req() r: any) {
    return this.service.minhas(r.user);
  }

  @Get(':id')
  detalhe(@Param('id') id: string, @Req() r: any) {
    return this.service.detalhe(+id, r.user);
  }

  @Patch(':id/acao')
  acao(@Param('id') id: string, @Body() dto: AcaoCompraDto, @Req() r: any) {
    return this.service.acao(+id, dto, r.user);
  }
}
