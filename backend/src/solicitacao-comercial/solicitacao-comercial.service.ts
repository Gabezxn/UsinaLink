import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { SolicitacaoComercial } from '../common/entities/core.entities';
import { CreateSolicitacaoComercialDto } from './dto/create-solicitacao-comercial.dto';

@Injectable()
export class SolicitacaoComercialService {
  constructor(
    @InjectRepository(SolicitacaoComercial) private readonly solicitacoes: Repository<SolicitacaoComercial>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  async criar(dto: CreateSolicitacaoComercialDto, user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    return this.solicitacoes.save(this.solicitacoes.create({
      idEmpresa,
      peca: dto.peca,
      fornecedor: dto.fornecedor,
      valorUnitario: dto.valorUnitario ? Number(dto.valorUnitario) : undefined,
      quantidade: dto.quantidade ? Number(dto.quantidade) : 1,
      status: 'registrada',
    }));
  }

  async minhas(user: any) {
    const idEmpresa = await this.ctx.obterEmpresaId(user.sub);
    return this.solicitacoes.find({ where: { idEmpresa }, order: { criadoEm: 'DESC' } });
  }
}
