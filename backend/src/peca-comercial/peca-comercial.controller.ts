import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PecaComercialService } from './peca-comercial.service';
import { CreatePecaComercialDto } from './dto/create-peca-comercial.dto';

@Controller('api/pecas-comerciais')
@UseGuards(JwtAuthGuard)
export class PecaComercialController {
  constructor(private readonly service: PecaComercialService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get('minhas')
  minhas(@Req() r: any) {
    return this.service.minhas(r.user);
  }

  @Post()
  criar(@Body() dto: CreatePecaComercialDto, @Req() r: any) {
    return this.service.criar(dto, r.user);
  }

  @Delete(':id')
  remover(@Param('id') id: string, @Req() r: any) {
    return this.service.remover(Number(id), r.user);
  }
}
