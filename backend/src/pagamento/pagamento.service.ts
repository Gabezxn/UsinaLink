import { BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { Pagamento, Pedido, Proposta } from '../common/entities/core.entities';
import { CheckoutDto, CreatePagamentoDto } from './dto/create-pagamento.dto';
import { StripeService } from './stripe.service';

@Injectable()
export class PagamentoService {
  constructor(
    @InjectRepository(Pagamento) private readonly pagamentos: Repository<Pagamento>,
    @InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>,
    @InjectRepository(Proposta) private readonly propostas: Repository<Proposta>,
    private readonly ctx: ContextoUsuarioService,
    private readonly notificacoes: NotificacaoService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
  ) {}

  async list(user: any, status?: string) {
    const where: any = status ? { status } : {};
    if (user.tipoUsuario === 'pessoa_fisica') {
      where.idPessoaFisicaPagadora = await this.ctx.obterPessoaFisicaId(user.sub);
    } else if (String(user.tipoUsuario).includes('empresa')) {
      where.idEmpresaPagadora = await this.ctx.obterEmpresaId(user.sub);
    } else {
      where.idUsinaRecebedora = await this.ctx.obterUsinaId(user.sub);
    }
    return this.pagamentos.find({ where });
  }

  /** Quem paga e o que paga: mesmas regras para o pagamento simulado e para o da Stripe. */
  private async prepararPagamento(pedidoId: string | number, user: any) {
    const comprador = await this.ctx.obterComprador(user.sub);
    const pedido = await this.pedidos.findOne({ where: { idPedido: Number(pedidoId) } });
    if (!pedido) throw new BadRequestException('Pedido não encontrado.');
    const dono = comprador.idPessoaFisica
      ? pedido.idPessoaFisicaCompradora === comprador.idPessoaFisica
      : !!comprador.idEmpresa && pedido.idEmpresaCompradora === comprador.idEmpresa;
    if (!dono) throw new ForbiddenException('Pedido nao pertence a sua conta.');

    if (pedido.status !== 'proposta_aceita') throw new BadRequestException('Este pedido não está aguardando pagamento.');
    const proposta = await this.propostas.findOne({ where: { idPedido: pedido.idPedido, status: 'aceita' } });
    if (!proposta) throw new BadRequestException('Nenhuma proposta aceita para este pedido.');

    const existente = await this.pagamentos.findOne({ where: { idPedido: pedido.idPedido } });
    if (existente && existente.status === 'pago') throw new BadRequestException('Pedido ja foi pago.');
    return { comprador, pedido, proposta, existente };
  }

  private async registrarPago(base: Awaited<ReturnType<PagamentoService['prepararPagamento']>>, metodo: string | undefined) {
    const { comprador, pedido, proposta, existente } = base;
    const dados = {
      idPedido: pedido.idPedido,
      idProposta: proposta.idProposta,
      idEmpresaPagadora: comprador.idEmpresa,
      idPessoaFisicaPagadora: comprador.idPessoaFisica,
      idUsinaRecebedora: proposta.idUsina,
      valor: proposta.valor,
      metodo,
      status: 'pago',
      dataPagamento: new Date(),
    };

    const pagamento = existente
      ? await (async () => { await this.pagamentos.update({ idPagamento: existente.idPagamento }, dados); return this.pagamentos.findOne({ where: { idPagamento: existente.idPagamento } }); })()
      : await this.pagamentos.save(this.pagamentos.create(dados));

    await this.pedidos.update({ idPedido: pedido.idPedido }, { status: 'em_producao' });
    this.notificacoes.criar(await this.ctx.idUsuarioDaUsina(proposta.idUsina), 'Pagamento recebido', `O pedido ${pedido.numeroPedido || '#' + pedido.idPedido} foi pago e entrou em producao.`, 'historico-pedidos.html');
    return pagamento;
  }

  configuracao() {
    return { stripe: this.stripe.ligado() };
  }

  /** Pagamento simulado (sem Stripe). Com a Stripe ligada ele fica bloqueado: so vale o pagamento confirmado por ela. */
  async criar(dto: CreatePagamentoDto, user: any) {
    if (this.stripe.ligado()) throw new BadRequestException('Use o pagamento online para concluir este pedido.');
    const base = await this.prepararPagamento(dto.pedidoId, user);
    return this.registrarPago(base, dto.metodo || dto.method);
  }

  private origemPermitida(origem?: string) {
    if (!origem) return false;
    const fixas = (this.config.get<string>('ALLOWED_ORIGINS', 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000') || '').split(',').map(o => o.trim()).filter(Boolean);
    return fixas.includes(origem) || /^https:\/\/(www\.)?usinalink\.com\.br$/.test(origem) || /^https:\/\/[a-z0-9-]+-usinalink\.tibiel2010\.workers\.dev$/.test(origem);
  }

  /** Cria a sessao de pagamento na Stripe e devolve o endereco para onde levar o cliente. */
  async criarCheckout(dto: CheckoutDto, user: any) {
    if (!this.stripe.ligado()) throw new ServiceUnavailableException('Pagamento online nao configurado.');
    const base = await this.prepararPagamento(dto.pedidoId, user);
    const origem = this.origemPermitida(dto.retorno) ? (dto.retorno as string) : 'https://usinalink.com.br';
    const valor = Math.round(Number(base.proposta.valor) * 100);
    if (!Number.isFinite(valor) || valor < 50) throw new BadRequestException('Valor do pedido invalido para pagamento.');
    const pagina = `${origem}/pagamento-pedido.html?pedidoId=${base.pedido.idPedido}`;
    const sessao = await this.stripe.criarSessao({
      valorCentavos: valor,
      nome: `Pedido ${base.pedido.numeroPedido || '#' + base.pedido.idPedido} - Usinalink`,
      sucesso: `${pagina}&stripe=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancelado: `${pagina}&stripe=cancelado`,
      metadata: { pedidoId: String(base.pedido.idPedido), idUsuario: String(user.sub) },
    });
    if (!sessao.url) throw new ServiceUnavailableException('O servico de pagamento nao devolveu o endereco de pagamento.');
    return { url: sessao.url };
  }

  /** Depois da volta da Stripe: confere la (nao no navegador) se foi pago, de quem e quanto, e so entao marca como pago. */
  async confirmarCheckout(sessionId: string, user: any) {
    if (!this.stripe.ligado()) throw new ServiceUnavailableException('Pagamento online nao configurado.');
    if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(String(sessionId || ''))) throw new BadRequestException('Sessao de pagamento invalida.');
    const sessao = await this.stripe.buscarSessao(sessionId);
    const pedidoId = Number(sessao.metadata?.pedidoId);
    if (!pedidoId || String(sessao.metadata?.idUsuario) !== String(user.sub)) throw new ForbiddenException('Esta sessao de pagamento nao e da sua conta.');
    // Ja confirmado antes (ex.: pagina recarregada): devolve o pagamento existente.
    const anterior = await this.pagamentos.findOne({ where: { idPedido: pedidoId, status: 'pago' } });
    if (anterior) return anterior;
    if (sessao.payment_status !== 'paid') throw new BadRequestException('O pagamento ainda nao foi confirmado.');
    const base = await this.prepararPagamento(pedidoId, user);
    const esperado = Math.round(Number(base.proposta.valor) * 100);
    if (sessao.amount_total !== esperado || String(sessao.currency).toLowerCase() !== 'brl') throw new BadRequestException('O valor pago nao confere com o pedido.');
    return this.registrarPago(base, 'Cartao (Stripe)');
  }
}
