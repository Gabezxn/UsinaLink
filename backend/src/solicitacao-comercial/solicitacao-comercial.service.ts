import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { SolicitacaoComercial, PecaComercial, Usina, Empresa, PessoaFisica } from '../common/entities/core.entities';
import { CreateSolicitacaoComercialDto } from './dto/create-solicitacao-comercial.dto';

@Injectable()
export class SolicitacaoComercialService {
  constructor(
    @InjectRepository(SolicitacaoComercial) private readonly solicitacoes: Repository<SolicitacaoComercial>,
    @InjectRepository(PecaComercial) private readonly pecas: Repository<PecaComercial>,
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(PessoaFisica) private readonly pessoasFisicas: Repository<PessoaFisica>,
    private readonly ctx: ContextoUsuarioService,
  ) {}

  async criar(dto: CreateSolicitacaoComercialDto, user: any) {
    const dono = await this.dono(user);
    // Com o id da peca, a usina vem do catalogo (nao do texto enviado pelo navegador).
    const peca = dto.pecaId ? await this.pecas.findOne({ where: { idPecaComercial: Number(dto.pecaId), ativo: true } }) : null;
    const usina = peca ? await this.usinas.findOne({ where: { idUsina: peca.idUsina } }) : null;
    return this.solicitacoes.save(this.solicitacoes.create({
      ...dono,
      idUsina: peca?.idUsina,
      idPecaComercial: peca?.idPecaComercial,
      peca: peca?.nome || dto.peca,
      fornecedor: usina ? (usina.nomeFantasia || usina.razaoSocial) : dto.fornecedor,
      valorUnitario: peca?.valorUnitario ?? (dto.valorUnitario ? Number(dto.valorUnitario) : undefined),
      quantidade: dto.quantidade ? Number(dto.quantidade) : 1,
      status: 'registrada',
    }));
  }

  async minhas(user: any) {
    return this.solicitacoes.find({ where: await this.dono(user), order: { criadoEm: 'DESC' } });
  }

  // Visao da usina: pedidos de compra das pecas do catalogo dela, feitos por empresas e pessoas fisicas.
  // Registros antigos (sem id_usina) sao achados pelo nome do fornecedor.
  async recebidas(user: any) {
    if (user.tipoUsuario === 'empresa' || user.tipoUsuario === 'pessoa_fisica') throw new ForbiddenException();
    const idUsina = await this.ctx.obterUsinaId(user.sub);
    const usina = await this.usinas.findOne({ where: { idUsina } });
    const nomes = [usina?.nomeFantasia, usina?.razaoSocial].filter((n): n is string => !!n);
    const where: any[] = [{ idUsina }, ...nomes.map(fornecedor => ({ idUsina: IsNull(), fornecedor }))];
    const rows = await this.solicitacoes.find({ where, order: { criadoEm: 'DESC' } });
    return Promise.all(rows.map(async row => {
      const empresa = row.idEmpresa ? await this.empresas.findOne({ where: { idEmpresa: row.idEmpresa } }) : null;
      const pessoa = row.idPessoaFisica ? await this.pessoasFisicas.findOne({ where: { idPessoaFisica: row.idPessoaFisica } }) : null;
      const solicitante = empresa
        ? { tipo: 'empresa', nome: empresa.nomeFantasia || empresa.razaoSocial, email: empresa.email, telefone: empresa.telefone }
        : { tipo: 'pessoa_fisica', nome: pessoa?.nome, email: pessoa?.email, telefone: pessoa?.telefone };
      return { ...row, solicitante };
    }));
  }

  // Solicitacao comercial pertence a uma empresa OU a uma pessoa fisica, conforme o tipo da conta.
  private async dono(user: any): Promise<{ idEmpresa: number } | { idPessoaFisica: number }> {
    if (user.tipoUsuario === 'pessoa_fisica') return { idPessoaFisica: await this.ctx.obterPessoaFisicaId(user.sub) };
    return { idEmpresa: await this.ctx.obterEmpresaId(user.sub) };
  }
}
