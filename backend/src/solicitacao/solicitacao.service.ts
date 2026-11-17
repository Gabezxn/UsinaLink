import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { PedidoService } from '../pedido/pedido.service';
import { Pedido, Solicitacao } from '../common/entities/core.entities';
import { CreateSolicitacaoDto } from './dto/create-solicitacao.dto';

function diasAte(dataIso?: string): number | undefined {
  if (!dataIso) return undefined;
  const alvo = new Date(dataIso);
  if (Number.isNaN(alvo.getTime())) return undefined;
  const dias = Math.ceil((alvo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : 1;
}

@Injectable()
export class SolicitacaoService {
  constructor(
    @InjectRepository(Solicitacao) private readonly solicitacoes: Repository<Solicitacao>,
    @InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>,
    private readonly ctx: ContextoUsuarioService,
    private readonly pedidoService: PedidoService,
  ) {}

  async criar(dto: CreateSolicitacaoDto, user: any) {
    const comprador = await this.ctx.obterComprador(user.sub);
    const solicitacao = await this.solicitacoes.save(this.solicitacoes.create({
      idEmpresa: comprador.idEmpresa,
      idPessoaFisica: comprador.idPessoaFisica,
      peca: dto.peca,
      categoria: dto.categoria,
      material: dto.material,
      quantidade: Number(dto.quantidade),
      prazoDesejado: dto.prazoDesejado,
      urgencia: dto.urgencia,
      localEntrega: dto.localEntrega,
      descricao: dto.descricao,
      arquivoTecnico: dto.arquivoTecnico,
      arquivoTecnicoNome: dto.arquivoTecnicoNome,
      status: 'aberta',
    }));

    const pedido = await this.pedidoService.criar({
      idSolicitacao: solicitacao.idSolicitacao,
      urgencia: dto.urgencia,
      observacoes: dto.descricao,
      localEntrega: dto.localEntrega,
      prazoEntregaDias: diasAte(dto.prazoDesejado),
      itens: [{ nome: dto.peca, categoria: dto.categoria, material: dto.material, quantidade: dto.quantidade }],
      arquivo: dto.arquivoTecnico ? { url: dto.arquivoTecnico, nome: dto.arquivoTecnicoNome } : undefined,
    }, user);
    solicitacao.idPedido = pedido.idPedido;
    return this.solicitacoes.save(solicitacao);
  }

  async minhas(user: any) {
    const comprador = await this.ctx.obterComprador(user.sub);
    const where = comprador.idPessoaFisica ? { idPessoaFisica: comprador.idPessoaFisica } : { idEmpresa: comprador.idEmpresa };
    const linhas = await this.solicitacoes.find({ where, order: { criadoEm: 'DESC' } });
    // O status que o comprador acompanha é o do pedido (aguardando pagamento, em produção...); o da solicitação fica "concluída" ao aceitar a proposta.
    const ids = linhas.map(l => l.idPedido).filter((id): id is number => !!id);
    const pedidos = ids.length ? await this.pedidos.find({ where: { idPedido: In(ids) }, select: ['idPedido', 'status'] }) : [];
    const statusPorPedido = new Map(pedidos.map(p => [p.idPedido, p.status]));
    return linhas.map(l => ({ ...l, statusPedido: l.idPedido ? statusPorPedido.get(l.idPedido) : undefined }));
  }

  async detalhe(id: number, user: any) {
    const solicitacao = await this.solicitacoes.findOne({ where: { idSolicitacao: id } });
    if (!solicitacao) throw new NotFoundException('Solicitação não encontrada.');
    const comprador = await this.ctx.obterComprador(user.sub);
    const dono = comprador.idPessoaFisica
      ? solicitacao.idPessoaFisica === comprador.idPessoaFisica
      : !!comprador.idEmpresa && solicitacao.idEmpresa === comprador.idEmpresa;
    if (!dono) throw new ForbiddenException();
    return solicitacao;
  }
}
