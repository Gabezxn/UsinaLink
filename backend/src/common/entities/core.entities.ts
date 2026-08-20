import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' }) idUsuario: number;
  @Column({ name: 'nome', nullable: true }) nome?: string;
  @Column({ name: 'email', unique: true }) email: string;
  @Column({ name: 'senha_hash', select: false }) senhaHash: string;
  @Column({ name: 'tipo_usuario' }) tipoUsuario: string;
  @Column({ name: 'status', default: 'ativo' }) status: string;
  @CreateDateColumn({ name: 'data_criacao' }) dataCriacao: Date;
  @UpdateDateColumn({ name: 'data_atualizacao' }) dataAtualizacao: Date;
  @OneToOne(() => Empresa, e => e.usuario) empresa?: Relation<Empresa>;
  @OneToOne(() => Usina, u => u.usuario) usina?: Relation<Usina>;
  @OneToOne(() => Funcionario, f => f.usuario) funcionario?: Relation<Funcionario>;
  @OneToOne(() => PessoaFisica, p => p.usuario) pessoaFisica?: Relation<PessoaFisica>;
}

@Entity({ name: 'pessoa_fisica' })
export class PessoaFisica {
  @PrimaryGeneratedColumn({ name: 'id_pessoa_fisica' }) idPessoaFisica: number;
  @Column({ name: 'id_usuario' }) idUsuario: number;
  @Column({ name: 'nome' }) nome: string;
  @Column({ name: 'cpf', unique: true }) cpf: string;
  @Column({ name: 'email', nullable: true }) email?: string;
  @Column({ name: 'telefone', nullable: true }) telefone?: string;
  @CreateDateColumn({ name: 'data_criacao' }) dataCriacao: Date;
  @UpdateDateColumn({ name: 'data_atualizacao' }) dataAtualizacao: Date;
  @OneToOne(() => Usuario, u => u.pessoaFisica) @JoinColumn({ name: 'id_usuario' }) usuario: Relation<Usuario>;
}

@Entity({ name: 'empresa' })
export class Empresa {
  @PrimaryGeneratedColumn({ name: 'id_empresa' }) idEmpresa: number;
  @Column({ name: 'id_usuario' }) idUsuario: number;
  @Column({ name: 'razao_social', nullable: true }) razaoSocial?: string;
  @Column({ name: 'nome_fantasia', nullable: true }) nomeFantasia?: string;
  @Column({ name: 'cnpj', unique: true }) cnpj: string;
  @Column({ name: 'email', nullable: true }) email?: string;
  @Column({ name: 'telefone', nullable: true }) telefone?: string;
  @Column({ name: 'responsavel', nullable: true }) responsavel?: string;
  @Column({ name: 'cargo_responsavel', nullable: true }) cargoResponsavel?: string;
  @Column({ name: 'setor_atuacao', nullable: true }) setorAtuacao?: string;
  @Column({ name: 'porte', nullable: true }) porte?: string;
  @Column({ name: 'descricao', type: 'text', nullable: true }) descricao?: string;
  @Column({ name: 'status_validacao', default: 'pendente' }) statusValidacao: string;
  @Column({ name: 'whatsapp', nullable: true }) whatsapp?: string;
  @Column({ name: 'site', nullable: true }) site?: string;
  @Column({ name: 'inscricao_estadual', nullable: true }) inscricaoEstadual?: string;
  @Column({ name: 'contrato_social_arquivo', type: 'text', nullable: true }) contratoSocialArquivo?: string;
  @Column({ name: 'contrato_social_nome', nullable: true }) contratoSocialNome?: string;
  @Column({ name: 'alvara_arquivo', type: 'text', nullable: true }) alvaraArquivo?: string;
  @Column({ name: 'alvara_nome', nullable: true }) alvaraNome?: string;
  @Column({ name: 'certificacoes', type: 'text', nullable: true }) certificacoes?: string;
  @Column({ name: 'notificacoes', type: 'simple-json', nullable: true }) notificacoes?: Record<string, boolean>;
  @OneToOne(() => Usuario, u => u.empresa) @JoinColumn({ name: 'id_usuario' }) usuario: Relation<Usuario>;
  @OneToMany(() => EnderecoEmpresa, e => e.empresa) enderecos: Relation<EnderecoEmpresa[]>;
  @OneToMany(() => Pedido, p => p.empresaCompradora) pedidos: Relation<Pedido[]>;
}

@Entity({ name: 'usina' })
export class Usina {
  @PrimaryGeneratedColumn({ name: 'id_usina' }) idUsina: number;
  @Column({ name: 'id_usuario' }) idUsuario: number;
  @Column({ name: 'razao_social', nullable: true }) razaoSocial?: string;
  @Column({ name: 'nome_fantasia', nullable: true }) nomeFantasia?: string;
  @Column({ name: 'cnpj', unique: true }) cnpj: string;
  @Column({ name: 'email', nullable: true }) email?: string;
  @Column({ name: 'telefone', nullable: true }) telefone?: string;
  @Column({ name: 'responsavel', nullable: true }) responsavel?: string;
  @Column({ name: 'especialidade', nullable: true }) especialidade?: string;
  @Column({ name: 'capacidade_producao', nullable: true }) capacidadeProducao?: string;
  @Column({ name: 'descricao', type: 'text', nullable: true }) descricao?: string;
  @Column({ name: 'status_validacao', default: 'pendente' }) statusValidacao: string;
  @Column({ name: 'maquinas_disponiveis', type: 'text', nullable: true }) maquinasDisponiveis?: string;
  @Column({ name: 'capacidade_mensal', nullable: true }) capacidadeMensal?: string;
  @Column({ name: 'turnos', nullable: true }) turnos?: string;
  @Column({ name: 'prazo_medio', nullable: true }) prazoMedio?: string;
  @Column({ name: 'certificacoes', type: 'simple-json', nullable: true }) certificacoes?: string[];
  @Column({ name: 'notificacoes', type: 'simple-json', nullable: true }) notificacoes?: Record<string, boolean>;
  @OneToOne(() => Usuario, u => u.usina) @JoinColumn({ name: 'id_usuario' }) usuario: Relation<Usuario>;
  @OneToMany(() => Proposta, p => p.usina) propostas: Relation<Proposta[]>;
  @OneToMany(() => PecaComercial, p => p.usina) pecasComerciais: Relation<PecaComercial[]>;
}

@Entity({ name: 'funcionario' })
export class Funcionario {
  @PrimaryGeneratedColumn({ name: 'id_funcionario' }) idFuncionario: number;
  @Column({ name: 'id_usuario', nullable: true }) idUsuario?: number;
  @Column({ name: 'id_empresa', nullable: true }) idEmpresa?: number;
  @Column({ name: 'id_usina', nullable: true }) idUsina?: number;
  @Column({ name: 'nome' }) nome: string;
  @Column({ name: 'email' }) email: string;
  @Column({ name: 'cargo', nullable: true }) cargo?: string;
  @Column({ name: 'tipo_acesso', nullable: true }) tipoAcesso?: string;
  @Column({ name: 'status', default: 'pendente' }) status: string;
  @OneToOne(() => Usuario, u => u.funcionario) @JoinColumn({ name: 'id_usuario' }) usuario?: Relation<Usuario>;
}

@Entity({ name: 'endereco_empresa' })
export class EnderecoEmpresa {
  @PrimaryGeneratedColumn({ name: 'id_endereco' }) idEndereco: number;
  @Column({ name: 'id_empresa' }) idEmpresa: number;
  @Column({ nullable: true }) cep?: string;
  @Column({ nullable: true }) rua?: string;
  @Column({ nullable: true }) numero?: string;
  @Column({ nullable: true }) complemento?: string;
  @Column({ nullable: true }) bairro?: string;
  @Column({ nullable: true }) cidade?: string;
  @Column({ nullable: true }) estado?: string;
  @Column({ nullable: true }) pais?: string;
  @ManyToOne(() => Empresa, e => e.enderecos) @JoinColumn({ name: 'id_empresa' }) empresa: Relation<Empresa>;
}

@Entity({ name: 'endereco_usina' })
export class EnderecoUsina {
  @PrimaryGeneratedColumn({ name: 'id_endereco' }) idEndereco: number;
  @Column({ name: 'id_usina' }) idUsina: number;
  @Column({ nullable: true }) cep?: string;
  @Column({ nullable: true }) rua?: string;
  @Column({ nullable: true }) numero?: string;
  @Column({ nullable: true }) complemento?: string;
  @Column({ nullable: true }) bairro?: string;
  @Column({ nullable: true }) cidade?: string;
  @Column({ nullable: true }) estado?: string;
  @Column({ nullable: true }) pais?: string;
}

@Entity({ name: 'peca' })
export class Peca {
  @PrimaryGeneratedColumn({ name: 'id_peca' }) idPeca: number;
  @Column({ nullable: true }) nome?: string;
  @Column({ nullable: true }) tipo?: string;
  @Column({ nullable: true }) categoria?: string;
  @Column({ type: 'text', nullable: true }) descricao?: string;
  @Column({ nullable: true }) material?: string;
  @Column({ nullable: true }) status?: string;
}

@Entity({ name: 'pedido' })
export class Pedido {
  @PrimaryGeneratedColumn({ name: 'id_pedido' }) idPedido: number;
  @Column({ name: 'id_empresa_compradora' }) idEmpresaCompradora: number;
  @Column({ name: 'id_usuario_solicitante', nullable: true }) idUsuarioSolicitante?: number;
  @Column({ name: 'numero_pedido', nullable: true }) numeroPedido?: string;
  @Column({ nullable: true }) urgencia?: string;
  @Column({ default: 'aberto' }) status: string;
  @Column({ type: 'text', nullable: true }) observacoes?: string;
  @Column({ name: 'prazo_entrega_dias', nullable: true }) prazoEntregaDias?: number;
  @Column({ name: 'data_pedido', type: 'timestamp', nullable: true }) dataPedido?: Date;
  @Column({ name: 'data_prevista_entrega', type: 'timestamp', nullable: true }) dataPrevistaEntrega?: Date;
  @Column({ name: 'data_entrega_real', type: 'timestamp', nullable: true }) dataEntregaReal?: Date;
  @Column({ name: 'valor_total', type: 'numeric', nullable: true }) valorTotal?: number;
  @ManyToOne(() => Empresa, e => e.pedidos) @JoinColumn({ name: 'id_empresa_compradora' }) empresaCompradora: Relation<Empresa>;
  @OneToMany(() => ItemPedido, i => i.pedido) itens: Relation<ItemPedido[]>;
  @OneToMany(() => ArquivoPedido, a => a.pedido) arquivos: Relation<ArquivoPedido[]>;
  @OneToMany(() => Proposta, p => p.pedido) propostas: Relation<Proposta[]>;
}

@Entity({ name: 'item_pedido' })
export class ItemPedido {
  @PrimaryGeneratedColumn({ name: 'id_item' }) idItem: number;
  @Column({ name: 'id_pedido' }) idPedido: number;
  @Column({ name: 'id_peca', nullable: true }) idPeca?: number;
  @Column({ name: 'nome_item', nullable: true }) nome?: string;
  @Column({ nullable: true }) categoria?: string;
  @Column({ nullable: true }) material?: string;
  @Column({ nullable: true }) quantidade?: number;
  @Column({ name: 'valor_unitario', type: 'numeric', nullable: true }) valorUnitario?: number;
  @Column({ name: 'valor_total', type: 'numeric', nullable: true }) valorTotal?: number;
  @Column({ type: 'text', nullable: true }) observacao?: string;
  @ManyToOne(() => Pedido, p => p.itens) @JoinColumn({ name: 'id_pedido' }) pedido: Relation<Pedido>;
}

@Entity({ name: 'arquivo_pedido' })
export class ArquivoPedido {
  @PrimaryGeneratedColumn({ name: 'id_arquivo' }) idArquivo: number;
  @Column({ name: 'id_pedido' }) idPedido: number;
  @Column({ name: 'url_arquivo', nullable: true }) urlArquivo?: string;
  @Column({ name: 'nome_arquivo', nullable: true }) nomeArquivo?: string;
  @ManyToOne(() => Pedido, p => p.arquivos) @JoinColumn({ name: 'id_pedido' }) pedido: Relation<Pedido>;
}

@Entity({ name: 'proposta' })
export class Proposta {
  @PrimaryGeneratedColumn({ name: 'id_proposta' }) idProposta: number;
  @Column({ name: 'id_pedido' }) idPedido: number;
  @Column({ name: 'id_usina' }) idUsina: number;
  @Column({ name: 'id_usuario_responsavel', nullable: true }) idUsuarioResponsavel?: number;
  @Column({ type: 'numeric' }) valor: number;
  @Column({ nullable: true }) prazo?: string;
  @Column({ type: 'numeric', nullable: true }) frete?: number;
  @Column({ type: 'text', nullable: true }) observacao?: string;
  @Column({ default: 'enviada' }) status: string;
  @CreateDateColumn({ name: 'data_envio' }) dataEnvio: Date;
  @ManyToOne(() => Pedido, p => p.propostas) @JoinColumn({ name: 'id_pedido' }) pedido: Relation<Pedido>;
  @ManyToOne(() => Usina, u => u.propostas) @JoinColumn({ name: 'id_usina' }) usina: Relation<Usina>;
}

@Entity({ name: 'pagamento' })
export class Pagamento {
  @PrimaryGeneratedColumn({ name: 'id_pagamento' }) idPagamento: number;
  @Column({ name: 'id_pedido' }) idPedido: number;
  @Column({ name: 'id_proposta', nullable: true }) idProposta?: number;
  @Column({ name: 'id_empresa_pagadora', nullable: true }) idEmpresaPagadora?: number;
  @Column({ name: 'id_usina_recebedora', nullable: true }) idUsinaRecebedora?: number;
  @Column({ type: 'numeric', nullable: true }) valor?: number;
  @Column({ nullable: true }) metodo?: string;
  @Column({ name: 'data_pagamento', type: 'timestamp', nullable: true }) dataPagamento?: Date;
  @Column({ default: 'pendente' }) status: string;
}

@Entity({ name: 'avaliacao_entrega' })
export class AvaliacaoEntrega {
  @PrimaryGeneratedColumn({ name: 'id_avaliacao' }) idAvaliacao: number;
  @Column({ name: 'id_pedido' }) idPedido: number;
  @Column({ name: 'id_empresa_avaliadora' }) idEmpresaAvaliadora: number;
  @Column({ name: 'id_usina_avaliada' }) idUsinaAvaliada: number;
  @Column({ name: 'nota_geral' }) nota: number;
  @Column({ name: 'nota_qualidade', nullable: true }) qualidade?: number;
  @Column({ name: 'nota_prazo', nullable: true }) prazo?: number;
  @Column({ name: 'nota_comunicacao', nullable: true }) comunicacao?: number;
  @Column({ type: 'text', nullable: true }) comentario?: string;
  @Column({ name: 'resposta_usina', type: 'text', nullable: true }) respostaDaUsina?: string;
}

export type SolicitacaoBloqueioStatus = 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada' | 'cancelada';

@Entity({ name: 'solicitacao_bloqueio_usina' })
export class SolicitacaoBloqueioUsina {
  @PrimaryGeneratedColumn({ name: 'id_solicitacao' }) idSolicitacao: number;
  @Column({ name: 'id_empresa' }) idEmpresa: number;
  @Column({ name: 'id_usina' }) idUsina: number;
  @Column({ name: 'id_pedido', nullable: true }) idPedido?: number;
  @Column({ type: 'text' }) motivo: string;
  @Column({ type: 'text', nullable: true }) descricao?: string;
  @Column({ default: 'pendente' }) status: SolicitacaoBloqueioStatus;
  @Column({ name: 'resposta_moderacao', type: 'text', nullable: true }) respostaModeracao?: string;
  @Column({ name: 'analisado_por', nullable: true }) analisadoPor?: string;
  @Column({ name: 'analisado_em', type: 'timestamp', nullable: true }) analisadoEm?: Date;
  @CreateDateColumn({ name: 'data_criacao' }) criadoEm: Date;
  @UpdateDateColumn({ name: 'data_atualizacao' }) atualizadoEm: Date;
}

@Entity({ name: 'bloqueio_usina' })
export class BloqueioUsina {
  @PrimaryGeneratedColumn({ name: 'id_bloqueio' }) idBloqueio: number;
  @Column({ name: 'id_usina' }) idUsina: number;
  @Column({ name: 'id_solicitacao', nullable: true }) idSolicitacao?: number;
  @Column({ default: true }) ativo: boolean;
  @Column({ type: 'text', nullable: true }) motivo?: string;
}

@Entity({ name: 'historico_status_pedido' })
export class HistoricoStatusPedido {
  @PrimaryGeneratedColumn({ name: 'id_historico' }) idHistorico: number;
  @Column({ name: 'id_pedido' }) idPedido: number;
  @Column({ name: 'status_anterior', nullable: true }) statusAnterior?: string;
  @Column({ name: 'status_novo' }) statusNovo: string;
  @Column({ name: 'id_usuario_responsavel', nullable: true }) idUsuarioResponsavel?: number;
  @Column({ type: 'text', nullable: true }) observacao?: string;
  @CreateDateColumn({ name: 'data' }) data: Date;
}

@Entity({ name: 'solicitacao' })
export class Solicitacao {
  @PrimaryGeneratedColumn({ name: 'id_solicitacao' }) idSolicitacao: number;
  @Column({ name: 'id_empresa' }) idEmpresa: number;
  @Column({ name: 'peca' }) peca: string;
  @Column({ nullable: true }) categoria?: string;
  @Column({ nullable: true }) material?: string;
  @Column({ nullable: true }) quantidade?: number;
  @Column({ name: 'prazo_desejado', type: 'date', nullable: true }) prazoDesejado?: string;
  @Column({ nullable: true }) urgencia?: string;
  @Column({ name: 'local_entrega', nullable: true }) localEntrega?: string;
  @Column({ type: 'text', nullable: true }) descricao?: string;
  @Column({ name: 'arquivo_tecnico', type: 'text', nullable: true }) arquivoTecnico?: string;
  @Column({ name: 'arquivo_tecnico_nome', nullable: true }) arquivoTecnicoNome?: string;
  @Column({ default: 'aberta' }) status: string;
  @CreateDateColumn({ name: 'data_criacao' }) criadoEm: Date;
  @UpdateDateColumn({ name: 'data_atualizacao' }) atualizadoEm: Date;
}

@Entity({ name: 'peca_comercial' })
export class PecaComercial {
  @PrimaryGeneratedColumn({ name: 'id_peca_comercial' }) idPecaComercial: number;
  @Column({ name: 'id_usina' }) idUsina: number;
  @Column() nome: string;
  @Column({ nullable: true }) material?: string;
  @Column({ nullable: true }) categoria?: string;
  @Column({ type: 'text', nullable: true }) descricao?: string;
  @Column({ nullable: true }) estoque?: number;
  @Column({ name: 'unidade_estoque', nullable: true }) unidadeEstoque?: string;
  @Column({ name: 'valor_unitario', type: 'numeric', nullable: true }) valorUnitario?: number;
  @Column({ name: 'prazo_entrega_dias', nullable: true }) prazoEntregaDias?: number;
  @Column({ default: true }) ativo: boolean;
  @CreateDateColumn({ name: 'data_criacao' }) criadoEm: Date;
  @ManyToOne(() => Usina, u => u.pecasComerciais) @JoinColumn({ name: 'id_usina' }) usina: Relation<Usina>;
}

@Entity({ name: 'solicitacao_comercial' })
export class SolicitacaoComercial {
  @PrimaryGeneratedColumn({ name: 'id_solicitacao_comercial' }) idSolicitacaoComercial: number;
  @Column({ name: 'id_empresa' }) idEmpresa: number;
  @Column() peca: string;
  @Column({ nullable: true }) fornecedor?: string;
  @Column({ name: 'valor_unitario', type: 'numeric', nullable: true }) valorUnitario?: number;
  @Column({ nullable: true }) quantidade?: number;
  @Column({ default: 'registrada' }) status: string;
  @CreateDateColumn({ name: 'data_criacao' }) criadoEm: Date;
}

@Entity({ name: 'modelo_contrato' })
export class ModeloContrato {
  @PrimaryGeneratedColumn({ name: 'id_modelo' }) idModelo: number;
  @Column() nome: string;
  @Column({ type: 'text', nullable: true }) conteudo?: string;
  @Column({ default: true }) ativo: boolean;
}

@Entity({ name: 'notificacao' })
export class Notificacao {
  @PrimaryGeneratedColumn({ name: 'id_notificacao' }) idNotificacao: number;
  @Column({ name: 'id_usuario' }) idUsuario: number;
  @Column() titulo: string;
  @Column({ type: 'text', nullable: true }) mensagem?: string;
  @Column({ default: false }) lida: boolean;
  @CreateDateColumn({ name: 'data_criacao' }) dataCriacao: Date;
}

export const ENTITIES = [
  Usuario, PessoaFisica, Empresa, Usina, Funcionario, EnderecoEmpresa, EnderecoUsina, Peca,
  Pedido, ItemPedido, ArquivoPedido, Proposta, Pagamento, AvaliacaoEntrega, Solicitacao, SolicitacaoComercial,
  SolicitacaoBloqueioUsina, BloqueioUsina, HistoricoStatusPedido, ModeloContrato, Notificacao, PecaComercial,
];
