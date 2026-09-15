import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { PedidoService } from '../pedido/pedido.service';
import { Solicitacao } from '../common/entities/core.entities';
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
    private readonly ctx: ContextoUsuarioService,
    private readonly pedidoService: PedidoService,
  ) {}

  async criar(dto: CreateSolicitacaoDto, user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    const solicitacao = await this.solicitacoes.save(this.solicitacoes.create({
      idEmpresa,
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
      prazoEntregaDias: diasAte(dto.prazoDesejado),
      itens: [{ nome: dto.peca, categoria: dto.categoria, material: dto.material, quantidade: dto.quantidade }],
      arquivo: dto.arquivoTecnico ? { url: dto.arquivoTecnico, nome: dto.arquivoTecnicoNome } : undefined,
    }, user);
    solicitacao.idPedido = pedido.idPedido;
    return this.solicitacoes.save(solicitacao);
  }

  async minhas(user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    return this.solicitacoes.find({ where: { idEmpresa }, order: { criadoEm: 'DESC' } });
  }

  async detalhe(id: number, user: any) {
    const solicitacao = await this.solicitacoes.findOne({ where: { idSolicitacao: id } });
    if (!solicitacao) throw new NotFoundException('Solicitação não encontrada.');
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    if (solicitacao.idEmpresa !== idEmpresa) throw new ForbiddenException();
    return solicitacao;
  }
}
