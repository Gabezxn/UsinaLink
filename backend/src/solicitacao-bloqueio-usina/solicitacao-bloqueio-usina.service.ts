import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { SolicitacaoBloqueioUsina, BloqueioUsina } from '../common/entities/core.entities';
import { CreateSolicitacaoBloqueioUsinaDto } from './dto/create-solicitacao-bloqueio-usina.dto';
import { UpdateStatusSolicitacaoBloqueioDto } from './dto/update-status-solicitacao-bloqueio.dto';

@Injectable()
export class SolicitacaoBloqueioUsinaService {
  constructor(
    @InjectRepository(SolicitacaoBloqueioUsina) private readonly solicitacoes: Repository<SolicitacaoBloqueioUsina>,
    @InjectRepository(BloqueioUsina) private readonly bloqueios: Repository<BloqueioUsina>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  async create(dto: CreateSolicitacaoBloqueioUsinaDto, user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    return this.solicitacoes.save(this.solicitacoes.create({
      idEmpresa,
      idUsina: Number(dto.usinaId),
      idPedido: dto.pedidoId ? Number(dto.pedidoId) : undefined,
      motivo: dto.motivo,
      descricao: dto.descricao,
      status: 'pendente',
    }));
  }

  async findMine(user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    return this.solicitacoes.find({ where: { idEmpresa } });
  }

  findAll() {
    return this.solicitacoes.find();
  }

  async findOne(id: number, user: any) {
    const solicitacao = await this.solicitacoes.findOne({ where: { idSolicitacao: id } });
    if (!solicitacao) throw new NotFoundException('Solicitação não encontrada.');
    if (user.tipoUsuario !== 'admin') {
      const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
      if (solicitacao.idEmpresa !== idEmpresa) throw new ForbiddenException();
    }
    return solicitacao;
  }

  async cancel(id: number, user: any) {
    const solicitacao = await this.findOne(id, user);
    await this.solicitacoes.update({ idSolicitacao: id }, { status: 'cancelada' });
    return this.findOne(id, user);
  }

  async updateStatus(id: number, dto: UpdateStatusSolicitacaoBloqueioDto, user: any) {
    const solicitacao = await this.solicitacoes.findOne({ where: { idSolicitacao: id } });
    if (!solicitacao) throw new NotFoundException('Solicitação não encontrada.');
    const status = dto.status || 'aprovada';
    await this.solicitacoes.update({ idSolicitacao: id }, {
      status,
      respostaModeracao: dto.respostaModeracao,
      analisadoPor: dto.analisadoPor || String(user.sub),
      analisadoEm: new Date(),
    });
    if (status === 'aprovada') {
      await this.bloqueios.save(this.bloqueios.create({ idUsina: solicitacao.idUsina, idSolicitacao: solicitacao.idSolicitacao, ativo: true, motivo: solicitacao.motivo }));
    }
    return this.solicitacoes.findOne({ where: { idSolicitacao: id } });
  }

  async isBlocked(_empresaId: any, usinaId: number) {
    return Boolean(await this.bloqueios.findOne({ where: { idUsina: usinaId, ativo: true } }));
  }
}
