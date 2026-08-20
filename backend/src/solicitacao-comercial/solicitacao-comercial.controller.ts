import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SolicitacaoComercialService } from './solicitacao-comercial.service';
import { CreateSolicitacaoComercialDto } from './dto/create-solicitacao-comercial.dto';

@Controller('api/solicitacoes-comerciais')
@UseGuards(JwtAuthGuard)
export class SolicitacaoComercialController {
  constructor(private readonly service: SolicitacaoComercialService) {}

  @Post()
  criar(@Body() dto: CreateSolicitacaoComercialDto, @Req() r: any) {
    return this.service.criar(dto, r.user);
  }

  @Get('minhas')
  minhas(@Req() r: any) {
    return this.service.minhas(r.user);
  }
}
