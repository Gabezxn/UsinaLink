import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacao } from '../common/entities/core.entities';

@Injectable()
export class NotificacaoService {
  constructor(@InjectRepository(Notificacao) private readonly notificacoes: Repository<Notificacao>) {}

  /** Nunca derruba a operacao principal: falha ao notificar so e ignorada. */
  async criar(idUsuario: number | null | undefined, titulo: string, mensagem?: string, link?: string) {
    if (!idUsuario) return;
    try {
      await this.notificacoes.save(this.notificacoes.create({ idUsuario, titulo, mensagem, link }));
    } catch {
      /* notificacao e opcional */
    }
  }
}
