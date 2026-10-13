import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { Pagamento, Pedido, Proposta } from '../common/entities/core.entities';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';

@Injectable()
export class PagamentoService {
  constructor(
    @InjectRepository(Pagamento) private readonly pagamentos: Repository<Pagamento>,
    @InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>,
    @InjectRepository(Proposta) private readonly propostas: Repository<Proposta>,
    private readonly ctx: ContextoUsuarioService,
    private readonly notificacoes: NotificacaoService,
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

  async criar(dto: CreatePagamentoDto, user: any) {
    const comprador = await this.ctx.obterComprador(user.sub);
    const pedido = await this.pedidos.findOne({ where: { idPedido: Number(dto.pedidoId) } });
    if (!pedido) throw new BadRequestException('Pedido não encontrado.');
    const dono = comprador.idPessoaFisica
      ? pedido.idPessoaFisicaCompradora === comprador.idPessoaFisica
      : !!comprador.idEmpresa && pedido.idEmpresaCompradora === comprador.idEmpresa;
    if (!dono) throw new ForbiddenException('Pedido nao pertence a sua conta.');

    const proposta = await this.propostas.findOne({ where: { idPedido: pedido.idPedido, status: In(['aceita', 'enviada']) } });
    if (!proposta) throw new BadRequestException('Nenhuma proposta aceita para este pedido.');

    const existente = await this.pagamentos.findOne({ where: { idPedido: pedido.idPedido } });
    if (existente && existente.status === 'pago') throw new BadRequestException('Pedido ja foi pago.');

    const dados = {
      idPedido: pedido.idPedido,
      idProposta: proposta.idProposta,
      idEmpresaPagadora: comprador.idEmpresa,
      idPessoaFisicaPagadora: comprador.idPessoaFisica,
      idUsinaRecebedora: proposta.idUsina,
      valor: proposta.valor,
      metodo: dto.metodo || dto.method,
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
}
