import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { Pagamento, Pedido, Proposta } from '../common/entities/core.entities';
import { CreatePagamentoDto } from './dto/create-pagamento.dto';

@Injectable()
export class PagamentoService {
  constructor(
    @InjectRepository(Pagamento) private readonly pagamentos: Repository<Pagamento>,
    @InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>,
    @InjectRepository(Proposta) private readonly propostas: Repository<Proposta>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  async list(user: any, status?: string) {
    const where: any = status ? { status } : {};
    if (String(user.tipoUsuario).includes('empresa')) {
      where.idEmpresaPagadora = await this.ctx.obterEmpresaId(user.sub);
    } else {
      where.idUsinaRecebedora = await this.ctx.obterUsinaId(user.sub);
    }
    return this.pagamentos.find({ where });
  }

  async criar(dto: CreatePagamentoDto, user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    const pedido = await this.pedidos.findOne({ where: { idPedido: Number(dto.pedidoId) } });
    if (!pedido) throw new BadRequestException('Pedido não encontrado.');
    if (pedido.idEmpresaCompradora !== idEmpresa) throw new ForbiddenException('Pedido nao pertence a sua empresa.');

    const proposta = await this.propostas.findOne({ where: { idPedido: pedido.idPedido, status: In(['aceita', 'enviada']) } });
    if (!proposta) throw new BadRequestException('Nenhuma proposta aceita para este pedido.');

    const existente = await this.pagamentos.findOne({ where: { idPedido: pedido.idPedido } });
    if (existente && existente.status === 'pago') throw new BadRequestException('Pedido ja foi pago.');

    const dados = {
      idPedido: pedido.idPedido,
      idProposta: proposta.idProposta,
      idEmpresaPagadora: idEmpresa,
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
    return pagamento;
  }
}
