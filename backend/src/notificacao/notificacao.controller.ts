import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Notificacao } from '../common/entities/core.entities';

@Controller('api/notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificacaoController {
  constructor(@InjectRepository(Notificacao) private readonly notificacoes: Repository<Notificacao>) {}

  @Get()
  list(@Req() r: any) {
    return this.notificacoes.find({ where: { idUsuario: r.user.sub }, order: { dataCriacao: 'DESC' } });
  }

  @Patch(':id/ler')
  async ler(@Param('id') id: string, @Req() r: any) {
    const notificacao = await this.notificacoes.findOne({ where: { idNotificacao: +id } });
    if (notificacao && notificacao.idUsuario === r.user.sub) await this.notificacoes.update({ idNotificacao: +id }, { lida: true });
    return { ok: true };
  }

  @Patch('ler-todas')
  async todas(@Req() r: any) {
    await this.notificacoes.update({ idUsuario: r.user.sub }, { lida: true });
    return { ok: true };
  }
}
