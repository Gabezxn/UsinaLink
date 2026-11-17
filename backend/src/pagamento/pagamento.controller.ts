import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PagamentoService } from './pagamento.service';
import { CheckoutDto, ConfirmarCheckoutDto, CreatePagamentoDto } from './dto/create-pagamento.dto';

@Controller('api/pagamentos')
@UseGuards(JwtAuthGuard)
export class PagamentoController {
  constructor(private readonly service: PagamentoService) {}

  @Get()
  list(@Req() r: any, @Query('status') status?: string) {
    return this.service.list(r.user, status);
  }

  @Get('config')
  config() {
    return this.service.configuracao();
  }

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto, @Req() r: any) {
    return this.service.criarCheckout(dto, r.user);
  }

  @Post('checkout/confirmar')
  confirmar(@Body() dto: ConfirmarCheckoutDto, @Req() r: any) {
    return this.service.confirmarCheckout(dto.sessionId, r.user);
  }

  @Post()
  criar(@Body() dto: CreatePagamentoDto, @Req() r: any) {
    return this.service.criar(dto, r.user);
  }
}
