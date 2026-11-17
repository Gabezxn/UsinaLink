import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import {
  PessoaFisica, Empresa, Usina, EnderecoEmpresa, Pedido, ItemPedido, Proposta, AvaliacaoEntrega, Pagamento,
  Solicitacao, SolicitacaoComercial, PecaComercial, HistoricoStatusPedido, ConfiguracaoSistema,
} from '../common/entities/core.entities';

const MARCA = 'PED-AUTO-';
const OBS_AUTO = 'Pedido de exemplo gerado automaticamente.';

const PECAS = [
  { nome: 'Eixo estriado', categoria: 'Eixos', material: 'Aço 4140' },
  { nome: 'Engrenagem helicoidal', categoria: 'Engrenagens', material: 'Aço cementado' },
  { nome: 'Flange inox', categoria: 'Flanges', material: 'Inox 304' },
  { nome: 'Bucha de bronze', categoria: 'Buchas', material: 'Bronze TM-23' },
  { nome: 'Polia de alumínio', categoria: 'Polias', material: 'Alumínio 6061' },
  { nome: 'Pino de fixação', categoria: 'Pinos', material: 'Aço 1045' },
];
// Do pedido recém-aberto ao concluído: cada conta sem pedido recebe um estado diferente, para o teste ter de tudo.
const ESTADOS = ['em_negociacao', 'aberto', 'proposta_aceita', 'concluido', 'em_producao'] as const;

const CHAVE_JA_RODOU = 'popular_contas_executado';

/**
 * Dá um pouco de movimento às contas que ainda estão vazias, para testar e apresentar o sistema.
 * - No Render (que define RENDER=true) roda sozinho UMA vez: na primeira subida depois da publicação, nas contas que já existem,
 *   e anota no banco que já rodou (tabela configuracao_sistema), então as subidas seguintes não fazem nada.
 * - A variável SEED_POPULAR_CONTAS força: "true" cria de novo (só para contas ainda vazias), "remover" apaga o que foi criado por aqui
 *   (e também anota que já rodou, para não recriar sozinho).
 * Só mexe em conta que não tem nenhum pedido (compradores), nenhuma proposta (usinas) e nenhuma peça/compra de catálogo.
 * Tudo que cria é marcado ("PED-AUTO-...") para poder ser removido depois. Fora do Render e sem a variável, não faz nada.
 */
@Injectable()
export class PopularContasService implements OnApplicationBootstrap {
  private readonly log = new Logger('PopularContas');

  constructor(
    @InjectRepository(PessoaFisica) private readonly pessoas: Repository<PessoaFisica>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    @InjectRepository(EnderecoEmpresa) private readonly enderecosEmpresa: Repository<EnderecoEmpresa>,
    @InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>,
    @InjectRepository(ItemPedido) private readonly itens: Repository<ItemPedido>,
    @InjectRepository(Proposta) private readonly propostas: Repository<Proposta>,
    @InjectRepository(AvaliacaoEntrega) private readonly avaliacoes: Repository<AvaliacaoEntrega>,
    @InjectRepository(Pagamento) private readonly pagamentos: Repository<Pagamento>,
    @InjectRepository(Solicitacao) private readonly solicitacoes: Repository<Solicitacao>,
    @InjectRepository(SolicitacaoComercial) private readonly compras: Repository<SolicitacaoComercial>,
    @InjectRepository(PecaComercial) private readonly catalogo: Repository<PecaComercial>,
    @InjectRepository(HistoricoStatusPedido) private readonly historico: Repository<HistoricoStatusPedido>,
    @InjectRepository(ConfiguracaoSistema) private readonly configuracao: Repository<ConfiguracaoSistema>,
  ) {}

  async onApplicationBootstrap() {
    const modo = (process.env.SEED_POPULAR_CONTAS || '').toLowerCase();
    try {
      if (modo === 'remover') {
        this.log.log(`Removido: ${JSON.stringify(await this.remover())}`);
        await this.marcarComoRodado();
        return;
      }
      const forcado = modo === 'true';
      const automatico = !!process.env.RENDER && !(await this.configuracao.findOne({ where: { chave: CHAVE_JA_RODOU } }));
      if (!forcado && !automatico) return;
      const resumo = await this.popular();
      this.log.log(`Criado${automatico && !forcado ? ' (automático, uma vez)' : ''}: ${JSON.stringify(resumo)}`);
      await this.marcarComoRodado();
    } catch (erro) {
      this.log.error(`Falhou: ${(erro as Error).message}`);
    }
  }

  private async marcarComoRodado() {
    await this.configuracao.save(this.configuracao.create({ chave: CHAVE_JA_RODOU, valor: new Date().toISOString() }));
  }

  private async localDe(comprador: { empresa?: Empresa; pessoa?: PessoaFisica }) {
    if (comprador.pessoa?.cidade) return `${comprador.pessoa.cidade}${comprador.pessoa.estado ? ' - ' + comprador.pessoa.estado : ''}`;
    if (comprador.empresa) {
      const e = await this.enderecosEmpresa.findOne({ where: { idEmpresa: comprador.empresa.idEmpresa } });
      if (e?.cidade) return `${e.cidade}${e.estado ? ' - ' + e.estado : ''}`;
    }
    return 'São Paulo - SP';
  }

  async popular() {
    const resumo = { pecasCatalogo: 0, pedidos: 0, propostas: 0, compras: 0 };
    const usinas = await this.usinas.find({ order: { idUsina: 'ASC' } });
    const empresas = await this.empresas.find({ order: { idEmpresa: 'ASC' } });
    const pessoas = await this.pessoas.find({ order: { idPessoaFisica: 'ASC' } });
    const agora = Date.now();
    const dias = (n: number) => new Date(agora - n * 24 * 3600 * 1000);

    // 1) Catálogo: toda usina com pelo menos uma peça à venda
    for (const [i, usina] of usinas.entries()) {
      if (await this.catalogo.count({ where: { idUsina: usina.idUsina } })) continue;
      const p = PECAS[(i + 2) % PECAS.length];
      await this.catalogo.save(this.catalogo.create({
        idUsina: usina.idUsina, nome: p.nome, material: p.material, categoria: p.categoria,
        descricao: 'Peça de exemplo (gerada automaticamente).', estoque: 20 + i * 5, unidadeEstoque: 'unidades',
        valorUnitario: 150 + i * 40, prazoEntregaDias: 5, ativo: true,
      }));
      resumo.pecasCatalogo += 1;
    }

    // 2) Compradores sem nenhum pedido: um pedido cada, em estados diferentes
    const compradores: { empresa?: Empresa; pessoa?: PessoaFisica; idUsuario: number; nome: string }[] = [
      ...empresas.map(e => ({ empresa: e, idUsuario: e.idUsuario, nome: e.nomeFantasia || e.razaoSocial || 'Empresa' })),
      ...pessoas.map(p => ({ pessoa: p, idUsuario: p.idUsuario, nome: p.nome })),
    ];
    let n = 0;
    for (const c of compradores) {
      const where = c.empresa ? { idEmpresaCompradora: c.empresa.idEmpresa } : { idPessoaFisicaCompradora: c.pessoa!.idPessoaFisica };
      if (await this.pedidos.count({ where })) continue;
      const estado = ESTADOS[n % ESTADOS.length];
      const peca = PECAS[n % PECAS.length];
      const quantidade = 10 + (n % 5) * 10;
      const local = await this.localDe(c);
      const solicitacao = await this.solicitacoes.save(this.solicitacoes.create({
        idEmpresa: c.empresa?.idEmpresa, idPessoaFisica: c.pessoa?.idPessoaFisica, peca: peca.nome, categoria: peca.categoria,
        material: peca.material, quantidade, urgencia: n % 3 === 0 ? 'Alta' : 'Normal', localEntrega: local,
        descricao: 'Pedido de exemplo gerado automaticamente.', status: estado === 'aberto' || estado === 'em_negociacao' ? 'aberta' : 'concluida',
      }));
      const pedido = await this.pedidos.save(this.pedidos.create({
        idEmpresaCompradora: c.empresa?.idEmpresa, idPessoaFisicaCompradora: c.pessoa?.idPessoaFisica, idUsuarioSolicitante: c.idUsuario,
        idSolicitacao: solicitacao.idSolicitacao, numeroPedido: `${MARCA}${String(solicitacao.idSolicitacao).padStart(4, '0')}`,
        urgencia: n % 3 === 0 ? 'alta' : 'normal', status: estado, observacoes: OBS_AUTO, localEntrega: local,
        prazoEntregaDias: 10 + (n % 4) * 5, dataPedido: dias(20 - (n % 10)),
      }));
      await this.solicitacoes.update({ idSolicitacao: solicitacao.idSolicitacao }, { idPedido: pedido.idPedido });
      await this.itens.save(this.itens.create({ idPedido: pedido.idPedido, nome: peca.nome, categoria: peca.categoria, material: peca.material, quantidade }));
      await this.historico.save(this.historico.create({ idPedido: pedido.idPedido, statusNovo: 'aberto', idUsuarioResponsavel: c.idUsuario, observacao: 'Pedido criado' }));
      resumo.pedidos += 1;

      // Propostas: a usina da vez e, quando houver, uma segunda para a comparação
      if (usinas.length && estado !== 'aberto') {
        const principal = usinas[n % usinas.length];
        const valorBase = 1800 + (n % 6) * 420;
        const aceita = estado !== 'em_negociacao';
        const p1 = await this.propostas.save(this.propostas.create({
          idPedido: pedido.idPedido, idUsina: principal.idUsina, idUsuarioResponsavel: principal.idUsuario, valor: valorBase,
          prazo: `${10 + (n % 4) * 5} dias`, frete: 80 + (n % 3) * 40, observacao: 'Proposta de exemplo.', status: aceita ? 'aceita' : 'enviada',
        }));
        resumo.propostas += 1;
        if (usinas.length > 1) {
          const outra = usinas[(n + 1) % usinas.length];
          await this.propostas.save(this.propostas.create({
            idPedido: pedido.idPedido, idUsina: outra.idUsina, idUsuarioResponsavel: outra.idUsuario, valor: valorBase + 260,
            prazo: `${14 + (n % 3) * 4} dias`, frete: 120, observacao: 'Proposta de exemplo.', status: aceita ? 'recusada' : 'enviada',
          }));
          resumo.propostas += 1;
        }
        if (aceita) {
          await this.pedidos.update({ idPedido: pedido.idPedido }, { valorTotal: valorBase });
          await this.historico.save(this.historico.create({ idPedido: pedido.idPedido, statusAnterior: 'aberto', statusNovo: 'proposta_aceita', observacao: 'Proposta aceita' }));
        }
        if (estado === 'em_producao' || estado === 'concluido') {
          await this.pagamentos.save(this.pagamentos.create({
            idPedido: pedido.idPedido, idProposta: p1.idProposta, idEmpresaPagadora: c.empresa?.idEmpresa, idPessoaFisicaPagadora: c.pessoa?.idPessoaFisica,
            idUsinaRecebedora: principal.idUsina, valor: valorBase, metodo: 'PIX', status: 'pago', dataPagamento: dias(8),
          }));
          await this.historico.save(this.historico.create({ idPedido: pedido.idPedido, statusAnterior: 'proposta_aceita', statusNovo: 'em_producao', observacao: 'Pagamento confirmado' }));
        }
        if (estado === 'concluido') {
          await this.pedidos.update({ idPedido: pedido.idPedido }, { dataEntregaReal: dias(2) });
          await this.historico.save(this.historico.create({ idPedido: pedido.idPedido, statusAnterior: 'em_producao', statusNovo: 'concluido', observacao: 'Entrega confirmada' }));
          await this.avaliacoes.save(this.avaliacoes.create({
            idPedido: pedido.idPedido, idEmpresaAvaliadora: c.empresa?.idEmpresa, idPessoaFisicaAvaliadora: c.pessoa?.idPessoaFisica,
            idUsinaAvaliada: principal.idUsina, nota: 5, qualidade: 5, prazo: 4, comunicacao: 5, comentario: 'Entrega no prazo e peça conforme o desenho.',
          }));
        }
      }
      n += 1;
    }

    // 3) Usina ainda sem nenhuma proposta: manda uma para um pedido aberto de exemplo
    for (const usina of usinas) {
      if (await this.propostas.count({ where: { idUsina: usina.idUsina } })) continue;
      const candidatos = await this.pedidos.find({ where: { numeroPedido: Like(`${MARCA}%`), status: In(['aberto', 'em_negociacao']) }, order: { idPedido: 'ASC' } });
      for (const alvo of candidatos) {
        if (await this.propostas.count({ where: { idPedido: alvo.idPedido, idUsina: usina.idUsina } })) continue;
        await this.propostas.save(this.propostas.create({
          idPedido: alvo.idPedido, idUsina: usina.idUsina, idUsuarioResponsavel: usina.idUsuario, valor: 2100 + usina.idUsina * 90,
          prazo: '12 dias', frete: 100, observacao: 'Proposta de exemplo.', status: 'enviada',
        }));
        if (alvo.status === 'aberto') await this.pedidos.update({ idPedido: alvo.idPedido }, { status: 'em_negociacao' });
        resumo.propostas += 1;
        break;
      }
    }

    // 4) Compradores sem nenhuma compra de catálogo: uma compra de uma peça de exemplo
    const pecas = await this.catalogo.find({ where: { ativo: true }, order: { idPecaComercial: 'ASC' } });
    for (const [i, c] of compradores.entries()) {
      if (!pecas.length) break;
      const where = c.empresa ? { idEmpresa: c.empresa.idEmpresa } : { idPessoaFisica: c.pessoa!.idPessoaFisica };
      if (await this.compras.count({ where })) continue;
      const peca = pecas[i % pecas.length];
      const usina = usinas.find(u => u.idUsina === peca.idUsina);
      await this.compras.save(this.compras.create({
        ...where, idUsina: peca.idUsina, idPecaComercial: peca.idPecaComercial, peca: peca.nome,
        fornecedor: usina?.nomeFantasia || usina?.razaoSocial, valorUnitario: peca.valorUnitario, quantidade: 2,
        status: 'registrada', observacaoUsina: 'Exemplo automático', historico: [{ status: 'registrada', em: new Date().toISOString() }],
      }));
      resumo.compras += 1;
    }
    return resumo;
  }

  /** Apaga só o que foi criado por popular(): pedidos "PED-AUTO-", peças e compras de exemplo. */
  async remover() {
    const resumo = { pedidos: 0, pecasCatalogo: 0, compras: 0 };
    const auto = await this.pedidos.find({ where: { numeroPedido: Like(`${MARCA}%`) }, select: ['idPedido', 'idSolicitacao'] });
    const ids = auto.map(p => p.idPedido);
    if (ids.length) {
      await this.avaliacoes.delete({ idPedido: In(ids) });
      await this.pagamentos.delete({ idPedido: In(ids) });
      await this.propostas.delete({ idPedido: In(ids) });
      await this.itens.delete({ idPedido: In(ids) });
      await this.historico.delete({ idPedido: In(ids) });
      const sols = auto.map(p => p.idSolicitacao).filter((s): s is number => !!s);
      await this.pedidos.delete({ idPedido: In(ids) });
      if (sols.length) await this.solicitacoes.delete({ idSolicitacao: In(sols) });
      resumo.pedidos = ids.length;
    }
    resumo.compras = (await this.compras.delete({ observacaoUsina: 'Exemplo automático' })).affected || 0;
    resumo.pecasCatalogo = (await this.catalogo.delete({ descricao: 'Peça de exemplo (gerada automaticamente).' })).affected || 0;
    return resumo;
  }
}
