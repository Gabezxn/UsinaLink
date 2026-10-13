import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { AvaliacaoEntrega, Pedido, Proposta, SolicitacaoComercial } from '../common/entities/core.entities';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { UpdateAvaliacaoDto } from './dto/update-avaliacao.dto';
import { ResponderAvaliacaoDto } from './dto/responder-avaliacao.dto';

const STATUS_CONCLUIDO = ['concluido', 'concluida', 'em_negociacao'];

@Injectable()
export class AvaliacaoService {
  constructor(
    @InjectRepository(AvaliacaoEntrega) private readonly avaliacoes: Repository<AvaliacaoEntrega>,
    @InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>,
    @InjectRepository(Proposta) private readonly propostas: Repository<Proposta>,
    @InjectRepository(SolicitacaoComercial) private readonly comprasCatalogo: Repository<SolicitacaoComercial>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  async create(dto: CreateAvaliacaoDto, user: any) {
    if (dto.notaGeral < 1 || dto.notaGeral > 5) throw new BadRequestException('Nota deve ser de 1 a 5.');
    const comprador = await this.ctx.obterComprador(user.sub);
    const avaliador = { idEmpresaAvaliadora: comprador.idEmpresa, idPessoaFisicaAvaliadora: comprador.idPessoaFisica };

    if (dto.solicitacaoComercialId) return this.criarParaCompra(dto, comprador, avaliador);
    if (!dto.pedidoId) throw new BadRequestException('Informe o pedido ou a compra avaliada.');

    const pedido = await this.pedidos.findOne({ where: { idPedido: Number(dto.pedidoId) } });
    if (!pedido || !STATUS_CONCLUIDO.includes(pedido.status)) throw new BadRequestException('Avaliacao apenas apos conclusao.');
    const dono = comprador.idPessoaFisica
      ? pedido.idPessoaFisicaCompradora === comprador.idPessoaFisica
      : !!comprador.idEmpresa && pedido.idEmpresaCompradora === comprador.idEmpresa;
    if (!dono) throw new ForbiddenException('Pedido nao pertence a sua conta.');
    const proposta = await this.propostas.findOne({ where: { idPedido: pedido.idPedido, status: In(['aceita', 'enviada']) } });
    if (await this.avaliacoes.findOne({ where: { idPedido: pedido.idPedido } })) throw new BadRequestException('Pedido ja avaliado.');
    return this.avaliacoes.save(this.avaliacoes.create({
      idPedido: pedido.idPedido,
      ...avaliador,
      idUsinaAvaliada: proposta?.idUsina,
      nota: dto.notaGeral,
      qualidade: dto.qualidade,
      prazo: dto.prazo,
      comunicacao: dto.comunicacao,
      comentario: dto.comentario,
    }));
  }

  /** Avaliacao de uma compra de peca do catalogo (so depois de entregue, uma vez). */
  private async criarParaCompra(dto: CreateAvaliacaoDto, comprador: { idEmpresa?: number; idPessoaFisica?: number }, avaliador: object) {
    const compra = await this.comprasCatalogo.findOne({ where: { idSolicitacaoComercial: Number(dto.solicitacaoComercialId) } });
    if (!compra) throw new BadRequestException('Compra nao encontrada.');
    const dono = comprador.idPessoaFisica
      ? compra.idPessoaFisica === comprador.idPessoaFisica
      : !!comprador.idEmpresa && compra.idEmpresa === comprador.idEmpresa;
    if (!dono) throw new ForbiddenException('Compra nao pertence a sua conta.');
    if (compra.status !== 'entregue') throw new BadRequestException('Avaliacao apenas apos a entrega.');
    if (!compra.idUsina) throw new BadRequestException('Compra sem usina vinculada.');
    if (await this.avaliacoes.findOne({ where: { idSolicitacaoComercial: compra.idSolicitacaoComercial } })) throw new BadRequestException('Compra ja avaliada.');
    return this.avaliacoes.save(this.avaliacoes.create({
      idSolicitacaoComercial: compra.idSolicitacaoComercial,
      ...avaliador,
      idUsinaAvaliada: compra.idUsina,
      nota: dto.notaGeral,
      qualidade: dto.qualidade,
      prazo: dto.prazo,
      comunicacao: dto.comunicacao,
      comentario: dto.comentario,
    }));
  }

  /** Avaliacoes feitas pelo usuario logado (empresa ou pessoa fisica). */
  async minhas(user: any) {
    const c = await this.ctx.obterComprador(user.sub);
    return this.avaliacoes.find({ where: c.idPessoaFisica ? { idPessoaFisicaAvaliadora: c.idPessoaFisica } : { idEmpresaAvaliadora: c.idEmpresa }, order: { criadoEm: 'DESC' } });
  }

  findByUsina(idUsinaAvaliada: number) {
    return this.avaliacoes.find({ where: { idUsinaAvaliada } });
  }

  findByEmpresa(idEmpresaAvaliadora: number) {
    return this.avaliacoes.find({ where: { idEmpresaAvaliadora } });
  }

  findByPedido(idPedido: number) {
    return this.avaliacoes.findOne({ where: { idPedido } });
  }

  async update(id: number, dto: UpdateAvaliacaoDto, user: any) {
    const avaliacao = await this.avaliacoes.findOne({ where: { idAvaliacao: id } });
    if (!avaliacao) throw new NotFoundException('Avaliação não encontrada.');
    const c = await this.ctx.obterComprador(user.sub);
    const dona = c.idPessoaFisica ? avaliacao.idPessoaFisicaAvaliadora === c.idPessoaFisica : !!c.idEmpresa && avaliacao.idEmpresaAvaliadora === c.idEmpresa;
    if (!dona) throw new ForbiddenException('Avaliacao nao pertence a sua conta.');
    await this.avaliacoes.update({ idAvaliacao: id }, {
      nota: dto.notaGeral,
      qualidade: dto.qualidade,
      prazo: dto.prazo,
      comunicacao: dto.comunicacao,
      comentario: dto.comentario,
    });
    return this.avaliacoes.findOne({ where: { idAvaliacao: id } });
  }

  async answer(id: number, dto: ResponderAvaliacaoDto, user: any) {
    const avaliacao = await this.avaliacoes.findOne({ where: { idAvaliacao: id } });
    if (!avaliacao) throw new NotFoundException('Avaliação não encontrada.');
    const idUsina = await this.ctx.obterUsinaId(user.sub);
    if (avaliacao.idUsinaAvaliada !== idUsina) throw new ForbiddenException('Avaliacao nao e sobre a sua usina.');
    await this.avaliacoes.update({ idAvaliacao: id }, { respostaDaUsina: dto.respostaDaUsina });
    return this.avaliacoes.findOne({ where: { idAvaliacao: id } });
  }

  async summary(idUsinaAvaliada: number) {
    const rows = await this.findByUsina(idUsinaAvaliada);
    const media = (campo: 'nota' | 'qualidade' | 'prazo' | 'comunicacao') => {
      const valores = rows.map(r => r[campo]).filter((v): v is number => typeof v === 'number');
      return valores.length ? Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10 : 0;
    };
    return {
      usinaId: idUsinaAvaliada,
      quantidade: rows.length,
      mediaGeral: media('nota'),
      mediaQualidade: media('qualidade'),
      mediaPrazo: media('prazo'),
      mediaComunicacao: media('comunicacao'),
    };
  }
}
