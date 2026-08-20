import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SolicitacaoService } from './solicitacao.service';
import { CreateSolicitacaoDto } from './dto/create-solicitacao.dto';

@Controller('api/solicitacoes')
@UseGuards(JwtAuthGuard)
export class SolicitacaoController {
  constructor(private readonly service: SolicitacaoService) {}

  @Post()
  criar(@Body() dto: CreateSolicitacaoDto, @Req() r: any) {
    return this.service.criar(dto, r.user);
  }

  @Get('meus')
  minhas(@Req() r: any) {
    return this.service.minhas(r.user);
  }

  @Get(':id')
  detalhe(@Param('id') id: string, @Req() r: any) {
    return this.service.detalhe(+id, r.user);
  }
}
