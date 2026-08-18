import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { AvaliacaoEntrega, Pedido, Proposta } from '../common/entities/core.entities';
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
    private readonly ctx: ContextoUsuarioService,
  ) {}

  async create(dto: CreateAvaliacaoDto, user: any) {
    if (dto.notaGeral < 1 || dto.notaGeral > 5) throw new BadRequestException('Nota deve ser de 1 a 5.');
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    const pedido = await this.pedidos.findOne({ where: { idPedido: Number(dto.pedidoId) } });
    if (!pedido || !STATUS_CONCLUIDO.includes(pedido.status)) throw new BadRequestException('Avaliacao apenas apos conclusao.');
    if (pedido.idEmpresaCompradora !== idEmpresa) throw new ForbiddenException('Pedido nao pertence a sua empresa.');
    const proposta = await this.propostas.findOne({ where: { idPedido: pedido.idPedido, status: In(['aceita', 'enviada']) } });
    if (await this.avaliacoes.findOne({ where: { idPedido: pedido.idPedido } })) throw new BadRequestException('Pedido ja avaliado.');
    return this.avaliacoes.save(this.avaliacoes.create({
      idPedido: pedido.idPedido,
      idEmpresaAvaliadora: pedido.idEmpresaCompradora,
      idUsinaAvaliada: proposta?.idUsina,
      nota: dto.notaGeral,
      qualidade: dto.qualidade,
      prazo: dto.prazo,
      comunicacao: dto.comunicacao,
      comentario: dto.comentario,
    }));
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
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    if (avaliacao.idEmpresaAvaliadora !== idEmpresa) throw new ForbiddenException('Avaliacao nao pertence a sua empresa.');
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
