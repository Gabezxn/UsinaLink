import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Comprador, ContextoUsuarioService } from '../contexto-usuario/contexto-usuario.service';
import { NotificacaoService } from '../notificacao/notificacao.service';
import { SolicitacaoComercial, PecaComercial, Usina, Empresa, PessoaFisica, AvaliacaoEntrega } from '../common/entities/core.entities';
import { CreateSolicitacaoComercialDto } from './dto/create-solicitacao-comercial.dto';
import { AcaoCompraDto } from './dto/acao-compra.dto';

/**
 * Ciclo de vida da compra de uma peca do catalogo:
 * registrada -> aceita -> paga -> em_separacao -> enviada -> entregue
 * (registrada -> recusada pela usina; registrada/aceita -> cancelada pelo comprador)
 */
const ROTULO: Record<string, string> = {
  registrada: 'Aguardando a usina',
  aceita: 'Aceita - aguardando pagamento',
  paga: 'Paga',
  em_separacao: 'Em separação',
  enviada: 'Enviada',
  entregue: 'Entregue',
  recusada: 'Recusada pela usina',
  cancelada: 'Cancelada',
};

@Injectable()
export class SolicitacaoComercialService {
  constructor(
    @InjectRepository(SolicitacaoComercial) private readonly solicitacoes: Repository<SolicitacaoComercial>,
    @InjectRepository(PecaComercial) private readonly pecas: Repository<PecaComercial>,
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(PessoaFisica) private readonly pessoasFisicas: Repository<PessoaFisica>,
    @InjectRepository(AvaliacaoEntrega) private readonly avaliacoes: Repository<AvaliacaoEntrega>,
    private readonly ctx: ContextoUsuarioService,
    private readonly notificacoes: NotificacaoService,
  ) {}

  async criar(dto: CreateSolicitacaoComercialDto, user: any) {
    const comprador = await this.ctx.obterComprador(user.sub);
    // Com o id da peca, a usina vem do catalogo (nao do texto enviado pelo navegador).
    const peca = dto.pecaId ? await this.pecas.findOne({ where: { idPecaComercial: Number(dto.pecaId), ativo: true } }) : null;
    const usina = peca ? await this.usinas.findOne({ where: { idUsina: peca.idUsina } }) : null;
    const quantidade = dto.quantidade ? Number(dto.quantidade) : 1;
    if (!Number.isInteger(quantidade) || quantidade < 1) throw new BadRequestException('Quantidade deve ser um número inteiro maior que zero.');

    const salva = await this.solicitacoes.save(this.solicitacoes.create({
      idEmpresa: comprador.idEmpresa,
      idPessoaFisica: comprador.idPessoaFisica,
      idUsina: peca?.idUsina,
      idPecaComercial: peca?.idPecaComercial,
      peca: peca?.nome || dto.peca,
      fornecedor: usina ? (usina.nomeFantasia || usina.razaoSocial) : dto.fornecedor,
      valorUnitario: peca?.valorUnitario ?? (dto.valorUnitario ? Number(dto.valorUnitario) : undefined),
      quantidade,
      status: 'registrada',
      historico: [{ status: 'registrada', em: new Date().toISOString() }],
    }));
    this.notificacoes.criar(usina?.idUsuario, 'Nova solicitação de peça', `${quantidade}x ${salva.peca} foi solicitada no seu catálogo.`, 'solicitacoes-pecas-usina.html');
    return salva;
  }

  async minhas(user: any) {
    const comprador = await this.ctx.obterComprador(user.sub);
    const where = comprador.idPessoaFisica ? { idPessoaFisica: comprador.idPessoaFisica } : { idEmpresa: comprador.idEmpresa };
    const rows = await this.solicitacoes.find({ where, order: { criadoEm: 'DESC' } });
    return Promise.all(rows.map(r => this.enriquecerParaComprador(r)));
  }

  /** Detalhe visivel para o comprador dono ou para a usina fornecedora. */
  async detalhe(id: number, user: any) {
    const row = await this.carregar(id);
    if (this.ehUsina(user)) {
      const idUsina = await this.ctx.obterUsinaId(user.sub);
      if (!(await this.usinaEhFornecedora(row, idUsina))) throw new ForbiddenException();
      return this.enriquecerParaUsina(row);
    }
    const comprador = await this.ctx.obterComprador(user.sub);
    if (!this.ehDono(row, comprador)) throw new ForbiddenException();
    return this.enriquecerParaComprador(row);
  }

  // Visao da usina: pedidos de compra das pecas do catalogo dela, feitos por empresas e pessoas fisicas.
  // Registros antigos (sem id_usina) sao achados pelo nome do fornecedor.
  async recebidas(user: any) {
    if (!this.ehUsina(user)) throw new ForbiddenException();
    const idUsina = await this.ctx.obterUsinaId(user.sub);
    const usina = await this.usinas.findOne({ where: { idUsina } });
    const nomes = [usina?.nomeFantasia, usina?.razaoSocial].filter((n): n is string => !!n);
    const where: any[] = [{ idUsina }, ...nomes.map(fornecedor => ({ idUsina: IsNull(), fornecedor }))];
    const rows = await this.solicitacoes.find({ where, order: { criadoEm: 'DESC' } });
    return Promise.all(rows.map(r => this.enriquecerParaUsina(r)));
  }

  async acao(id: number, dto: AcaoCompraDto, user: any) {
    const row = await this.carregar(id);
    const usinaAgindo = this.ehUsina(user);
    let proximo: string;
    const extra: Partial<SolicitacaoComercial> = {};

    if (usinaAgindo) {
      const idUsina = await this.ctx.obterUsinaId(user.sub);
      if (!(await this.usinaEhFornecedora(row, idUsina))) throw new ForbiddenException();
      if (!row.idUsina) extra.idUsina = idUsina; // registro antigo: passa a ficar vinculado
      switch (dto.acao) {
        case 'aceitar': this.exigir(row, ['registrada'], 'aceitar'); proximo = 'aceita'; break;
        case 'recusar': this.exigir(row, ['registrada'], 'recusar'); proximo = 'recusada'; extra.observacaoUsina = dto.observacao; break;
        case 'separar': this.exigir(row, ['paga'], 'iniciar a separação (aguarde o pagamento)'); proximo = 'em_separacao'; break;
        case 'enviar': this.exigir(row, ['em_separacao'], 'marcar como enviada'); proximo = 'enviada'; break;
        default: throw new ForbiddenException('Ação não permitida para a usina.');
      }
    } else {
      const comprador = await this.ctx.obterComprador(user.sub);
      if (!this.ehDono(row, comprador)) throw new ForbiddenException();
      switch (dto.acao) {
        case 'pagar': {
          this.exigir(row, ['aceita'], 'pagar');
          const total = Number(row.valorUnitario ?? 0) * Number(row.quantidade ?? 1);
          if (!(total > 0)) throw new BadRequestException('Esta peça está sob consulta e não tem valor definido para pagamento.');
          // Baixa automatica no estoque do catalogo quando a compra e paga.
          if (row.idPecaComercial) {
            const peca = await this.pecas.findOne({ where: { idPecaComercial: row.idPecaComercial } });
            const qtd = Number(row.quantidade ?? 1);
            if (peca && peca.estoque != null) {
              if (peca.estoque < qtd) throw new BadRequestException(`Estoque insuficiente: restam ${peca.estoque} unidade(s) desta peça.`);
              await this.pecas.update({ idPecaComercial: peca.idPecaComercial }, { estoque: peca.estoque - qtd });
            }
          }
          proximo = 'paga';
          extra.pago = true;
          extra.metodoPagamento = dto.metodo || 'PIX';
          extra.dataPagamento = new Date();
          extra.protocoloPagamento = `USL-C${row.idSolicitacaoComercial}-${Date.now().toString().slice(-6)}`;
          break;
        }
        case 'cancelar': this.exigir(row, ['registrada', 'aceita'], 'cancelar'); proximo = 'cancelada'; break;
        case 'confirmar_entrega': this.exigir(row, ['enviada'], 'confirmar a entrega'); proximo = 'entregue'; break;
        default: throw new ForbiddenException('Ação não permitida para o comprador.');
      }
    }

    await this.solicitacoes.update(
      { idSolicitacaoComercial: id },
      { ...extra, status: proximo, historico: [...(row.historico || []), { status: proximo, em: new Date().toISOString() }] },
    );
    const atualizada = await this.carregar(id);
    await this.avisarOutroLado(atualizada, usinaAgindo, proximo);
    return usinaAgindo ? this.enriquecerParaUsina(atualizada) : this.enriquecerParaComprador(atualizada);
  }

  // ----- helpers -----

  private ehUsina(user: any) {
    return user.tipoUsuario !== 'empresa' && user.tipoUsuario !== 'pessoa_fisica';
  }

  private ehDono(row: SolicitacaoComercial, c: Comprador) {
    return c.idPessoaFisica ? row.idPessoaFisica === c.idPessoaFisica : !!c.idEmpresa && row.idEmpresa === c.idEmpresa;
  }

  private async carregar(id: number) {
    const row = await this.solicitacoes.findOne({ where: { idSolicitacaoComercial: id } });
    if (!row) throw new NotFoundException('Compra não encontrada.');
    return row;
  }

  private exigir(row: SolicitacaoComercial, permitidos: string[], acao: string) {
    if (!permitidos.includes(row.status)) {
      throw new BadRequestException(`Não é possível ${acao} uma compra com status "${ROTULO[row.status] || row.status}".`);
    }
  }

  private async usinaEhFornecedora(row: SolicitacaoComercial, idUsina: number) {
    if (row.idUsina) return row.idUsina === idUsina;
    const usina = await this.usinas.findOne({ where: { idUsina } });
    return !!row.fornecedor && [usina?.nomeFantasia, usina?.razaoSocial].includes(row.fornecedor);
  }

  private total(row: SolicitacaoComercial) {
    return row.valorUnitario != null ? Number(row.valorUnitario) * Number(row.quantidade ?? 1) : null;
  }

  private async enriquecerParaComprador(row: SolicitacaoComercial) {
    const usina = row.idUsina ? await this.usinas.findOne({ where: { idUsina: row.idUsina } }) : null;
    const avaliacao = await this.avaliacoes.findOne({ where: { idSolicitacaoComercial: row.idSolicitacaoComercial } });
    return {
      ...row,
      statusRotulo: ROTULO[row.status] || row.status,
      total: this.total(row),
      usina: usina ? { idUsina: usina.idUsina, nome: usina.nomeFantasia || usina.razaoSocial, email: usina.email, telefone: usina.telefone } : null,
      avaliacao: avaliacao || null,
    };
  }

  private async enriquecerParaUsina(row: SolicitacaoComercial) {
    const empresa = row.idEmpresa ? await this.empresas.findOne({ where: { idEmpresa: row.idEmpresa } }) : null;
    const pessoa = row.idPessoaFisica ? await this.pessoasFisicas.findOne({ where: { idPessoaFisica: row.idPessoaFisica } }) : null;
    const solicitante = empresa
      ? { tipo: 'empresa', nome: empresa.nomeFantasia || empresa.razaoSocial, email: empresa.email, telefone: empresa.telefone }
      : { tipo: 'pessoa_fisica', nome: pessoa?.nome, email: pessoa?.email, telefone: pessoa?.telefone };
    return { ...row, statusRotulo: ROTULO[row.status] || row.status, total: this.total(row), solicitante };
  }

  private async avisarOutroLado(row: SolicitacaoComercial, usinaAgiu: boolean, status: string) {
    const rotulo = ROTULO[status] || status;
    if (usinaAgiu) {
      const idUsuario = await this.ctx.idUsuarioDoComprador({ idEmpresa: row.idEmpresa, idPessoaFisica: row.idPessoaFisica });
      const link = row.idPessoaFisica ? `compra-pessoa-fisica.html?id=${row.idSolicitacaoComercial}` : undefined;
      await this.notificacoes.criar(idUsuario, 'Atualização da sua compra', `${row.peca}: ${rotulo}.`, link);
    } else {
      const idUsuario = await this.ctx.idUsuarioDaUsina(row.idUsina);
      await this.notificacoes.criar(idUsuario, 'Atualização de compra recebida', `${row.peca}: ${rotulo}.`, 'solicitacoes-pecas-usina.html');
    }
  }
}
