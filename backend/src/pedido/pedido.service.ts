import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Comprador, ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { Pedido, ItemPedido, ArquivoPedido, HistoricoStatusPedido, Proposta, Empresa, PessoaFisica, Solicitacao } from '../common/entities/core.entities';

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
    @InjectRepository(PessoaFisica) private readonly pessoasFisicas: Repository<PessoaFisica>,
    @InjectRepository(Solicitacao) private readonly solicitacoes: Repository<Solicitacao>,
    private readonly ctx: ContextoUsuarioService,
    private readonly notificacoes: NotificacaoService,
  ) {}

  private ehDoComprador(pedido: Pedido, c: Comprador) {
    return c.idPessoaFisica
      ? pedido.idPessoaFisicaCompradora === c.idPessoaFisica
      : !!c.idEmpresa && pedido.idEmpresaCompradora === c.idEmpresa;
  }

  private async enrich(pedido: Pedido) {
    const [propostas, empresa, pessoa, itens, arquivos] = await Promise.all([
      this.propostas.find({ where: { idPedido: pedido.idPedido } }),
      pedido.idEmpresaCompradora ? this.empresas.findOne({ where: { idEmpresa: pedido.idEmpresaCompradora } }) : null,
      pedido.idPessoaFisicaCompradora ? this.pessoasFisicas.findOne({ where: { idPessoaFisica: pedido.idPessoaFisicaCompradora } }) : null,
      this.itens.find({ where: { idPedido: pedido.idPedido } }),
      this.arquivos.find({ where: { idPedido: pedido.idPedido } }),
    ]);
    // Comprador pessoa fisica aparece no mesmo campo que a empresa, assim as telas da usina funcionam sem mudanca.
    const empresaCompradora = empresa || (pessoa
      ? { nomeFantasia: pessoa.nome, razaoSocial: pessoa.nome, email: pessoa.email, telefone: pessoa.telefone, tipoComprador: 'pessoa_fisica' }
      : null);
    return { ...pedido, propostas, empresaCompradora, itens, arquivos };
  }

  async criar(dto: any, user: any) {
    const comprador = await this.ctx.obterComprador(user.sub);
    const prazoDigits = dto.prazoEntregaDias ?? String(dto.prazo || '').match(/\d+/)?.[0];
    const pedido = await this.pedidos.save(this.pedidos.create({
      idEmpresaCompradora: comprador.idEmpresa,
      idPessoaFisicaCompradora: comprador.idPessoaFisica,
      idUsuarioSolicitante: user.sub,
      idSolicitacao: dto.idSolicitacao || undefined,
      numeroPedido: dto.numeroPedido || `PED-${Date.now()}`,
      urgencia: dto.urgencia,
      status: 'aberto',
      observacoes: dto.observacoes || dto.descricao,
      localEntrega: dto.localEntrega,
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
    const comprador = await this.ctx.obterComprador(user.sub);
    const where = comprador.idPessoaFisica ? { idPessoaFisicaCompradora: comprador.idPessoaFisica } : { idEmpresaCompradora: comprador.idEmpresa };
    const pedidos = await this.pedidos.find({ where });
    return Promise.all(pedidos.map(p => this.enrich(p)));
  }

  async disponiveis(user: any) {
    const idUsina = await this.ctx.obterUsinaId(user.sub);
    const pedidos = await this.pedidos.find({ where: { status: In(STATUS_ABERTOS) } });
    const enriched = await Promise.all(pedidos.map(p => this.enrich(p)));
    // Pedido que esta usina ja respondeu com proposta (exceto cancelada) sai da lista.
    return enriched.filter(p => !p.propostas.some(pr => pr.idUsina === idUsina && pr.status !== 'cancelada'));
  }

  async detalhe(id: number | string, user: any) {
    const pedido = await this.pedidos.findOne({ where: { idPedido: Number(id) } });
    if (!pedido) throw new NotFoundException('Pedido não encontrado.');
    const enriched = await this.enrich(pedido);
    if (user.tipoUsuario === 'pessoa_fisica' || user.tipoUsuario?.includes('empresa')) {
      const comprador = await this.ctx.obterComprador(user.sub);
      if (!this.ehDoComprador(pedido, comprador)) throw new ForbiddenException();
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

  async confirmarEntrega(id: number | string, user: any) {
    if (!user.tipoUsuario?.includes('empresa') && user.tipoUsuario !== 'pessoa_fisica' && !user.tipoUsuario?.includes('usina')) throw new ForbiddenException();
    const pedido = await this.detalhe(id, user);
    if (pedido.status !== 'em_producao') throw new ForbiddenException('Pedido ainda nao esta em producao.');
    if (user.tipoUsuario?.includes('usina')) {
      const idUsina = await this.ctx.obterUsinaId(user.sub);
      if (!pedido.propostas?.some(p => p.status === 'aceita' && p.idUsina === idUsina)) throw new ForbiddenException('Somente a usina com a proposta aceita pode confirmar a entrega.');
    }
    await this.pedidos.update({ idPedido: Number(id) }, { status: 'concluido', dataEntregaReal: new Date() });
    await this.historico.save(this.historico.create({ idPedido: Number(id), statusNovo: 'concluido', idUsuarioResponsavel: user.sub, observacao: user.tipoUsuario?.includes('usina') ? 'Entrega confirmada pela usina' : 'Entrega confirmada pelo comprador' }));
    const aceita = pedido.propostas?.find(p => p.status === 'aceita');
    if (user.tipoUsuario?.includes('usina')) {
      this.notificacoes.criar(pedido.idUsuarioSolicitante, 'Entrega confirmada', `A usina confirmou a entrega do pedido ${pedido.numeroPedido || '#' + pedido.idPedido}.`, 'historico-pedidos.html');
    } else {
      this.notificacoes.criar(await this.ctx.idUsuarioDaUsina(aceita?.idUsina), 'Entrega confirmada', `O comprador confirmou a entrega do pedido ${pedido.numeroPedido || '#' + pedido.idPedido}.`, 'historico-pedidos.html');
    }
    return this.detalhe(id, user);
  }

  async cancelar(id: number | string, user: any) {
    const pedido = await this.detalhe(id, user);
    await this.pedidos.update({ idPedido: Number(id) }, { status: 'cancelado' });
    if (pedido.idSolicitacao) {
      await this.solicitacoes.update({ idSolicitacao: pedido.idSolicitacao }, { status: 'cancelada' });
    }
    return this.detalhe(id, user);
  }
}
