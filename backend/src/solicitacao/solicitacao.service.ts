import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { Solicitacao } from '../common/entities/core.entities';
import { CreateSolicitacaoDto } from './dto/create-solicitacao.dto';

@Injectable()
export class SolicitacaoService {
  constructor(
    @InjectRepository(Solicitacao) private readonly solicitacoes: Repository<Solicitacao>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  async criar(dto: CreateSolicitacaoDto, user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    return this.solicitacoes.save(this.solicitacoes.create({
      idEmpresa,
      peca: dto.peca,
      categoria: dto.categoria,
      material: dto.material,
      quantidade: dto.quantidade ? Number(dto.quantidade) : undefined,
      prazoDesejado: dto.prazoDesejado || undefined,
      urgencia: dto.urgencia,
      localEntrega: dto.localEntrega,
      descricao: dto.descricao,
      arquivoTecnico: dto.arquivoTecnico,
      arquivoTecnicoNome: dto.arquivoTecnicoNome,
      status: 'aberta',
    }));
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
