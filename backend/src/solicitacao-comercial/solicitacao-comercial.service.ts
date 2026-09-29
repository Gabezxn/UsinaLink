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
    const dono = await this.dono(user);
    return this.solicitacoes.save(this.solicitacoes.create({
      ...dono,
      peca: dto.peca,
      fornecedor: dto.fornecedor,
      valorUnitario: dto.valorUnitario ? Number(dto.valorUnitario) : undefined,
      quantidade: dto.quantidade ? Number(dto.quantidade) : 1,
      status: 'registrada',
    }));
  }

  async minhas(user: any) {
    return this.solicitacoes.find({ where: await this.dono(user), order: { criadoEm: 'DESC' } });
  }

  // Solicitacao comercial pertence a uma empresa OU a uma pessoa fisica, conforme o tipo da conta.
  private async dono(user: any): Promise<{ idEmpresa: number } | { idPessoaFisica: number }> {
    if (user.tipoUsuario === 'pessoa_fisica') return { idPessoaFisica: await this.ctx.obterPessoaFisicaId(user.sub) };
    return { idEmpresa: await this.ctx.obterEmpresaId(user.sub) };
  }
}
