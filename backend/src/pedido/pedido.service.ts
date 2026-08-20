import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { Pedido, ItemPedido, ArquivoPedido, HistoricoStatusPedido, Proposta, Empresa } from '../common/entities/core.entities';

const STATUS_ABERTOS = ['aberto', 'em_negociacao'];

@Injectable()
export class PedidoService {
  constructor(
    @InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>,
    @InjectRepository(ItemPedido) private readonly itens: Repository<ItemPedido>,
    @InjectRepository(ArquivoPedido) private readonly arquivos: Repository<ArquivoPedido>,
    @InjectRepository(HistoricoStatusPedido) private readonly historico: Repository<HistoricoStatusPedido>,
    @InjectRepository(Proposta) private readonly propostas: Repository<Proposta>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  private async enrich(pedido: Pedido) {
    const [propostas, empresaCompradora, itens, arquivos] = await Promise.all([
      this.propostas.find({ where: { idPedido: pedido.idPedido } }),
      this.empresas.findOne({ where: { idEmpresa: pedido.idEmpresaCompradora } }),
      this.itens.find({ where: { idPedido: pedido.idPedido } }),
      this.arquivos.find({ where: { idPedido: pedido.idPedido } }),
    ]);
    return { ...pedido, propostas, empresaCompradora, itens, arquivos };
  }

  async criar(dto: any, user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    const prazoDigits = dto.prazoEntregaDias ?? String(dto.prazo || '').match(/\d+/)?.[0];
    const pedido = await this.pedidos.save(this.pedidos.create({
      idEmpresaCompradora: idEmpresa,
      idUsuarioSolicitante: user.sub,
      numeroPedido: dto.numeroPedido || `PED-${Date.now()}`,
      urgencia: dto.urgencia,
      status: 'aberto',
      observacoes: dto.observacoes || dto.descricao,
      prazoEntregaDias: prazoDigits ? Number(prazoDigits) : undefined,
      dataPedido: new Date(),
    }));

    const itensDto = Array.isArray(dto.itens) && dto.itens.length ? dto.itens : [{ nome: dto.peca, categoria: dto.categoria, material: dto.material, quantidade: dto.quantidade }];
    for (const item of itensDto) {
      if (!item?.nome && !item?.categoria && !item?.material) continue;
      await this.itens.save(this.itens.create({
        idPedido: pedido.idPedido,
        nome: item.nome,
        categoria: item.categoria,
        material: item.material,
        quantidade: item.quantidade ? Number(item.quantidade) : undefined,
      }));
    }

    const arquivosDto = Array.isArray(dto.arquivos) ? dto.arquivos : (dto.arquivo ? [dto.arquivo] : []);
    for (const arquivo of arquivosDto) {
      await this.arquivos.save(this.arquivos.create({
        idPedido: pedido.idPedido,
        urlArquivo: typeof arquivo === 'string' ? arquivo : arquivo?.url,
        nomeArquivo: typeof arquivo === 'string' ? undefined : arquivo?.nome,
      }));
    }

    await this.historico.save(this.historico.create({ idPedido: pedido.idPedido, statusNovo: 'aberto', idUsuarioResponsavel: user.sub, observacao: 'Pedido criado' }));
    return this.enrich(pedido);
  }

  async meus(user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    const pedidos = await this.pedidos.find({ where: { idEmpresaCompradora: idEmpresa } });
    return Promise.all(pedidos.map(p => this.enrich(p)));
  }

  async disponiveis() {
    const pedidos = await this.pedidos.find({ where: { status: In(STATUS_ABERTOS) } });
    return Promise.all(pedidos.map(p => this.enrich(p)));
  }

  async detalhe(id: number | string, user: any) {
    const pedido = await this.pedidos.findOne({ where: { idPedido: Number(id) } });
    if (!pedido) throw new NotFoundException('Pedido não encontrado.');
    const enriched = await this.enrich(pedido);
    if (user.tipoUsuario?.includes('empresa')) {
      const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
      if (pedido.idEmpresaCompradora !== idEmpresa) throw new ForbiddenException();
    } else {
      const idUsina = await this.ctx.obterUsinaId(user.sub);
      const temProposta = enriched.propostas?.some(p => p.idUsina === idUsina);
      if (!STATUS_ABERTOS.includes(pedido.status) && !temProposta) throw new ForbiddenException();
    }
    return enriched;
  }

  async atualizar(id: number | string, dto: any, user: any) {
    await this.detalhe(id, user);
    await this.pedidos.update({ idPedido: Number(id) }, dto);
    return this.detalhe(id, user);
  }

  async cancelar(id: number | string, user: any) {
    await this.detalhe(id, user);
    await this.pedidos.update({ idPedido: Number(id) }, { status: 'cancelado' });
    return this.detalhe(id, user);
  }
}
