import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FavoritoService } from './favorito.service';

@Controller('api/favoritos')
@UseGuards(JwtAuthGuard)
export class FavoritoController {
  constructor(private readonly service: FavoritoService) {}

  @Get()
  listar(@Req() r: any) {
    return this.service.listar(r.user.sub);
  }

  @Post(':tipo/:id')
  alternar(@Param('tipo') tipo: string, @Param('id') id: string, @Req() r: any) {
    return this.service.alternar(r.user.sub, tipo, Number(id));
  }
}
