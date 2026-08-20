import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { Proposta, Pedido, Usina, BloqueioUsina } from '../common/entities/core.entities';

const STATUS_ABERTOS = ['aberto', 'em_negociacao'];

@Injectable()
export class PropostaService {
  constructor(
    @InjectRepository(Proposta) private readonly propostas: Repository<Proposta>,
    @InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>,
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    @InjectRepository(BloqueioUsina) private readonly bloqueios: Repository<BloqueioUsina>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  private async enrich(proposta: Proposta) {
    const [pedido, usina] = await Promise.all([
      this.pedidos.findOne({ where: { idPedido: proposta.idPedido }, relations: ['itens', 'empresaCompradora'] }),
      this.usinas.findOne({ where: { idUsina: proposta.idUsina } }),
    ]);
    return { ...proposta, pedido, usina };
  }

  async criar(dto: any, user: any) {
    const idUsina = await this.ctx.obterUsinaId(user.sub);
    if (await this.bloqueios.findOne({ where: { idUsina, ativo: true } })) throw new ForbiddenException('Usina bloqueada.');

    const idPedido = Number(dto.pedidoId || dto.solicitacaoId);
    const pedido = await this.pedidos.findOne({ where: { idPedido } });
    if (!pedido || !STATUS_ABERTOS.includes(pedido.status)) throw new BadRequestException('Pedido indisponivel.');

    if (await this.propostas.findOne({ where: { idPedido: pedido.idPedido, idUsina, status: Not('cancelada') } })) {
      throw new ConflictException('Ja existe proposta desta usina para este pedido.');
    }

    const proposta = await this.propostas.save(this.propostas.create({
      idPedido: pedido.idPedido,
      idUsina,
      idUsuarioResponsavel: user.sub,
      valor: Number(dto.valor),
      prazo: dto.prazo,
      frete: dto.frete !== undefined && dto.frete !== '' ? Number(dto.frete) : undefined,
      observacao: dto.observacao,
      status: 'enviada',
    }));

    if (pedido.status === 'aberto') await this.pedidos.update({ idPedido: pedido.idPedido }, { status: 'em_negociacao' });
    return proposta;
  }

  async recebidas(user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    const pedidos = await this.pedidos.find({ where: { idEmpresaCompradora: idEmpresa } });
    const ids = pedidos.map(p => p.idPedido);
    if (!ids.length) return [];
    const rows = await this.propostas.createQueryBuilder('p').where('p.idPedido IN (:...ids)', { ids }).andWhere('p.status != :cancelada', { cancelada: 'cancelada' }).getMany();
    return Promise.all(rows.map(p => this.enrich(p)));
  }

  async enviadas(user: any) {
    const idUsina = await this.ctx.obterUsinaId(user.sub);
    const rows = await this.propostas.find({ where: { idUsina } });
    return Promise.all(rows.map(p => this.enrich(p)));
  }

  async detalhe(id: number | string, user: any) {
    const proposta = await this.propostas.findOne({ where: { idProposta: Number(id) } });
    if (!proposta) throw new NotFoundException('Proposta não encontrada.');
    const enriched = await this.enrich(proposta);
    if (user.tipoUsuario?.includes('empresa')) {
      const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
      if (enriched.pedido?.idEmpresaCompradora !== idEmpresa) throw new ForbiddenException();
    }
    if (user.tipoUsuario?.includes('usina')) {
      const idUsina = await this.ctx.obterUsinaId(user.sub);
      if (proposta.idUsina !== idUsina) throw new ForbiddenException();
    }
    return enriched;
  }

  async aceitar(id: number | string, user: any) {
    const proposta = await this.detalhe(id, user);
    await this.propostas.update({ idPedido: proposta.idPedido }, { status: 'recusada' });
    await this.propostas.update({ idProposta: proposta.idProposta }, { status: 'aceita' });
    await this.pedidos.update({ idPedido: proposta.idPedido }, { status: 'proposta_aceita', valorTotal: proposta.valor });
    return this.propostas.findOne({ where: { idProposta: proposta.idProposta } });
  }

  async recusar(id: number | string, user: any) {
    await this.detalhe(id, user);
    await this.propostas.update({ idProposta: Number(id) }, { status: 'recusada' });
    return this.propostas.findOne({ where: { idProposta: Number(id) } });
  }

  async cancelar(id: number | string, user: any) {
    await this.detalhe(id, user);
    await this.propostas.update({ idProposta: Number(id) }, { status: 'cancelada' });
    return this.propostas.findOne({ where: { idProposta: Number(id) } });
  }
}
