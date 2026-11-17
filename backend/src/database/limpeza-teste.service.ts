import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * TEMPORÁRIO. Quem testou a segurança do site mandou scripts/HTML pelos formulários. Eles não executam (a tela escapa o texto), mas ficaram
 * salvos e apareceriam na apresentação. Esta rotina roda no Render, apaga os registros com esse tipo de texto e anota o que apagou.
 * Idempotente: depois da primeira vez não acha mais nada. Sai do código logo depois de confirmada.
 */
const PADRAO = [
  '<[/!]?[a-z]', // <script>, <img ...>, </div>, <!-- ...
  'javascript:',
  '\\mon[a-z]+[[:space:]]*=', // onerror=, onload= ...
  '&lt;[[:space:]]*/?[a-z]', // marcação escapada
  '%3c[[:space:]]*/?[a-z]', // marcação codificada
  'drop[[:space:]]+table',
  'union[[:space:]]+select',
  "'[[:space:]]*or[[:space:]]+'?1'?[[:space:]]*=",
].join('|');

// Colunas que nunca entram na busca (anexos em base64, senhas, tokens, endereços de arquivo...)
const IGNORAR_COLUNA = /(hash|senha|token|arquivo|imagem|url|contrato|alvara|historico|codigo)/i;
// Tabelas de conta: não se apaga a conta (a pessoa perderia o acesso); o texto suspeito vira "Conta de teste"
const CONTAS = new Set(['usuario', 'empresa', 'usina', 'pessoa_fisica', 'endereco_empresa', 'endereco_usina']);
// Colunas únicas/identificadoras de conta: não dá para trocar por texto fixo; só são relatadas
const NAO_TROCAR = /^(email|cnpj|cpf)$/i;

export interface ResumoLimpeza {
  rodou: boolean;
  em?: string;
  apagados: Record<string, number>;
  neutralizados: Record<string, number>;
  pendentes: string[];
  erros: string[];
}

@Injectable()
export class LimpezaTesteService implements OnApplicationBootstrap {
  private readonly log = new Logger('LimpezaTeste');
  resumo: ResumoLimpeza = { rodou: false, apagados: {}, neutralizados: {}, pendentes: [], erros: [] };

  constructor(private readonly db: DataSource) {}

  async onApplicationBootstrap() {
    if (!process.env.RENDER && process.env.LIMPEZA_TESTE !== 'true') return;
    try {
      await this.limpar();
      this.log.log(`Resumo: ${JSON.stringify(this.resumo)}`);
    } catch (erro) {
      this.resumo.erros.push((erro as Error).message);
      this.log.error(`Falhou: ${(erro as Error).message}`);
    }
  }

  private q = (nome: string) => `"${nome.replace(/"/g, '')}"`;

  private conta(tipo: 'apagados' | 'neutralizados', tabela: string, n: number) {
    if (n) this.resumo[tipo][tabela] = (this.resumo[tipo][tabela] || 0) + n;
  }

  private async ids(sql: string, params: any[] = []): Promise<number[]> {
    return (await this.db.query(sql, params)).map((r: any) => Number(Object.values(r)[0]));
  }

  private async apagar(tabela: string, coluna: string, ids: number[]) {
    if (!ids.length) return 0;
    const r = await this.db.query(`DELETE FROM ${this.q(tabela)} WHERE ${this.q(coluna)} = ANY($1::int[]) RETURNING 1`, [ids]);
    return r.length;
  }

  /** Apaga o pedido e tudo que depende dele (filhos primeiro, por causa das chaves estrangeiras). */
  private async apagarPedidos(ids: number[]) {
    ids = [...new Set(ids)];
    if (!ids.length) return;
    for (const t of ['item_pedido', 'arquivo_pedido', 'proposta', 'pagamento', 'avaliacao_entrega', 'historico_status_pedido']) {
      try { await this.apagar(t, 'id_pedido', ids); } catch (e) { this.resumo.erros.push(`${t}: ${(e as Error).message}`); }
    }
    try { await this.apagar('solicitacao', 'id_pedido', ids); } catch (e) { this.resumo.erros.push(`solicitacao: ${(e as Error).message}`); }
    this.conta('apagados', 'pedido', await this.apagar('pedido', 'id_pedido', ids));
  }

  private async tratar(tabela: string, pk: string, ids: number[]) {
    ids = [...new Set(ids)];
    if (!ids.length) return;
    switch (tabela) {
      case 'pedido':
        return this.apagarPedidos(ids);
      case 'item_pedido':
        return this.apagarPedidos(await this.ids('SELECT id_pedido FROM item_pedido WHERE id_item = ANY($1::int[])', [ids]));
      case 'arquivo_pedido':
        return this.apagarPedidos(await this.ids(`SELECT id_pedido FROM arquivo_pedido WHERE ${this.q(pk)} = ANY($1::int[])`, [ids]));
      case 'solicitacao': {
        const pedidos = await this.ids('SELECT id_pedido FROM solicitacao WHERE id_solicitacao = ANY($1::int[]) AND id_pedido IS NOT NULL', [ids]);
        await this.apagarPedidos(pedidos);
        this.conta('apagados', 'solicitacao', await this.apagar('solicitacao', 'id_solicitacao', ids));
        return;
      }
      case 'proposta': {
        // Pedido já aceito/pago não pode ficar sem a proposta: nesse caso vai o pedido inteiro.
        const aceitos = await this.ids(
          "SELECT p.id_pedido FROM proposta p JOIN pedido d ON d.id_pedido = p.id_pedido WHERE p.id_proposta = ANY($1::int[]) AND d.status NOT IN ('aberto','em_negociacao')",
          [ids],
        );
        await this.apagarPedidos(aceitos);
        await this.apagar('pagamento', 'id_proposta', ids);
        this.conta('apagados', 'proposta', await this.apagar('proposta', 'id_proposta', ids));
        return;
      }
      case 'peca_comercial': {
        const compras = await this.ids('SELECT id_solicitacao_comercial FROM solicitacao_comercial WHERE id_peca_comercial = ANY($1::int[])', [ids]);
        await this.tratar('solicitacao_comercial', 'id_solicitacao_comercial', compras);
        this.conta('apagados', 'peca_comercial', await this.apagar('peca_comercial', 'id_peca_comercial', ids));
        return;
      }
      case 'solicitacao_comercial':
        await this.apagar('avaliacao_entrega', 'id_solicitacao_comercial', ids);
        this.conta('apagados', 'solicitacao_comercial', await this.apagar('solicitacao_comercial', 'id_solicitacao_comercial', ids));
        return;
      default:
        this.conta('apagados', tabela, await this.apagar(tabela, pk, ids));
    }
  }

  async limpar() {
    const achados: { tabela: string; pk: string; coluna: string; obrigatoria: boolean; ids: number[] }[] = [];
    for (const m of this.db.entityMetadatas) {
      const pk = m.primaryColumns[0];
      if (!pk || m.tableType !== 'regular') continue;
      for (const c of m.columns) {
        const tipo = typeof c.type === 'function' ? (c.type as any).name : String(c.type);
        if (!['String', 'varchar', 'character varying', 'text'].includes(tipo)) continue;
        if (IGNORAR_COLUNA.test(c.databaseName) || c.isPrimary) continue;
        let ids: number[] = [];
        try {
          ids = await this.ids(`SELECT ${this.q(pk.databaseName)} FROM ${this.q(m.tableName)} WHERE ${this.q(c.databaseName)} ~* $1`, [PADRAO]);
        } catch (erro) {
          this.resumo.erros.push(`${m.tableName}.${c.databaseName}: ${(erro as Error).message}`);
          continue;
        }
        if (ids.length) achados.push({ tabela: m.tableName, pk: pk.databaseName, coluna: c.databaseName, obrigatoria: !c.isNullable, ids });
      }
    }
    // Contas: só neutraliza o texto (e relata o que não dá para trocar). O resto é apagado.
    for (const a of achados.filter(x => CONTAS.has(x.tabela))) {
      if (NAO_TROCAR.test(a.coluna)) { this.resumo.pendentes.push(`${a.tabela}.${a.coluna}: ids ${a.ids.join(',')}`); continue; }
      const valor = a.obrigatoria ? 'Conta de teste' : null;
      const r = await this.db.query(`UPDATE ${this.q(a.tabela)} SET ${this.q(a.coluna)} = $1 WHERE ${this.q(a.pk)} = ANY($2::int[]) RETURNING 1`, [valor, a.ids]);
      this.conta('neutralizados', `${a.tabela}.${a.coluna}`, r.length);
    }
    const porTabela = new Map<string, { pk: string; ids: number[] }>();
    for (const a of achados.filter(x => !CONTAS.has(x.tabela))) {
      const atual = porTabela.get(a.tabela) || { pk: a.pk, ids: [] };
      atual.ids.push(...a.ids);
      porTabela.set(a.tabela, atual);
    }
    // Ordem: o que depende de outras coisas primeiro, para não tentar apagar duas vezes a mesma coisa
    const ordem = ['proposta', 'solicitacao_comercial', 'peca_comercial', 'avaliacao_entrega', 'solicitacao', 'item_pedido', 'arquivo_pedido', 'pedido'];
    const nomes = [...ordem.filter(n => porTabela.has(n)), ...[...porTabela.keys()].filter(n => !ordem.includes(n))];
    for (const tabela of nomes) {
      const { pk, ids } = porTabela.get(tabela)!;
      try { await this.tratar(tabela, pk, ids); } catch (erro) { this.resumo.erros.push(`${tabela}: ${(erro as Error).message}`); }
    }
    this.resumo.rodou = true;
    this.resumo.em = new Date().toISOString();
    return this.resumo;
  }
}
