import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import {
  Usuario, PessoaFisica, Empresa, Usina, Funcionario, EnderecoEmpresa, EnderecoUsina,
  Pedido, ItemPedido, Proposta, AvaliacaoEntrega, Pagamento, Notificacao,
  Solicitacao, SolicitacaoComercial, SolicitacaoBloqueioUsina, PecaComercial,
} from '../common/entities/core.entities';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(PessoaFisica) private readonly pessoasFisicas: Repository<PessoaFisica>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    @InjectRepository(Funcionario) private readonly funcionarios: Repository<Funcionario>,
    @InjectRepository(EnderecoEmpresa) private readonly enderecosEmpresa: Repository<EnderecoEmpresa>,
    @InjectRepository(EnderecoUsina) private readonly enderecosUsina: Repository<EnderecoUsina>,
    @InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>,
    @InjectRepository(ItemPedido) private readonly itensPedido: Repository<ItemPedido>,
    @InjectRepository(Proposta) private readonly propostas: Repository<Proposta>,
    @InjectRepository(AvaliacaoEntrega) private readonly avaliacoes: Repository<AvaliacaoEntrega>,
    @InjectRepository(Pagamento) private readonly pagamentos: Repository<Pagamento>,
    @InjectRepository(Notificacao) private readonly notificacoes: Repository<Notificacao>,
    @InjectRepository(Solicitacao) private readonly solicitacoes: Repository<Solicitacao>,
    @InjectRepository(SolicitacaoComercial) private readonly solicitacoesComerciais: Repository<SolicitacaoComercial>,
    @InjectRepository(SolicitacaoBloqueioUsina) private readonly solicitacoesBloqueio: Repository<SolicitacaoBloqueioUsina>,
    @InjectRepository(PecaComercial) private readonly pecasComerciais: Repository<PecaComercial>,
    private readonly passwords: PasswordService,
  ) {}

  private async garantir<T extends object>(repo: Repository<T>, where: Record<string, any>, dados: Record<string, any>): Promise<T> {
    const existente = await repo.findOne({ where: where as any });
    if (existente) return existente;
    const entidade = repo.create(dados as any) as T;
    return repo.save(entidade as any);
  }

  private async garantirUsuario(nome: string, email: string, tipoUsuario: string, senhaHash: string) {
    return this.garantir(this.usuarios, { email }, { nome, email, senhaHash, tipoUsuario, status: 'ativo' });
  }

  async onModuleInit() {
    const senhaHash = await this.passwords.hash('Demo@123');

    const empresaUsuario = await this.garantirUsuario('Metal Forte Ltda.', 'empresa@demo.com', 'empresa', senhaHash);
    const usinaUsuario = await this.garantirUsuario('Atlas Metais', 'usina@demo.com', 'usina', senhaHash);
    const pessoaUsuario = await this.garantirUsuario('Joao Demo', 'pessoa@demo.com', 'pessoa_fisica', senhaHash);
    await this.garantirUsuario('Administrador Demo', 'admin@demo.com', 'admin', senhaHash);

    const empresa = await this.garantir(this.empresas, { idUsuario: empresaUsuario.idUsuario }, {
      idUsuario: empresaUsuario.idUsuario, razaoSocial: 'Metal Forte Ltda.', nomeFantasia: 'Metal Forte', cnpj: '11222333000181',
      email: empresaUsuario.email, telefone: '11999990000', responsavel: 'Maria Compras', cargoResponsavel: 'Gerente',
      setorAtuacao: 'Industria metalmecanica', porte: 'Medio porte', descricao: 'Empresa demo para testes do UsinaLink.',
      statusValidacao: 'aprovado', whatsapp: '11988887777', site: 'https://metalforte.exemplo.com.br',
      inscricaoEstadual: '123.456.789.110', certificacoes: 'ISO 9001, ISO 14001',
      notificacoes: { propostasEmail: true, alertasPrazo: true, mensagensFornecedores: false, resumoSemanal: true },
    });

    const usina = await this.garantir(this.usinas, { idUsuario: usinaUsuario.idUsuario }, {
      idUsuario: usinaUsuario.idUsuario, razaoSocial: 'Atlas Metais Ltda.', nomeFantasia: 'Atlas Metais', cnpj: '22333444000191',
      email: usinaUsuario.email, telefone: '21999990000', responsavel: 'Carlos Tecnico', especialidade: 'Usinagem de precisao',
      capacidadeProducao: '8.000 pecas/mes', descricao: 'Usina demo para testes do UsinaLink.', statusValidacao: 'aprovado',
      maquinasDisponiveis: 'Tornos CNC, centro de usinagem, corte laser', capacidadeMensal: '8.000 pecas', turnos: '2 turnos', prazoMedio: '15 dias',
      certificacoes: ['ISO 9001', 'CNC'],
      notificacoes: { novosPedidos: true, propostasAceitas: true, alertasPrazo: false, mensagens: true },
    });

    await this.garantir(this.pessoasFisicas, { idUsuario: pessoaUsuario.idUsuario }, {
      idUsuario: pessoaUsuario.idUsuario, nome: pessoaUsuario.nome, cpf: '12345678909', email: pessoaUsuario.email, telefone: '31999990000',
    });

    await this.garantir(this.enderecosEmpresa, { idEmpresa: empresa.idEmpresa }, {
      idEmpresa: empresa.idEmpresa, cep: '04000-000', rua: 'Avenida Industrial', numero: '1200', bairro: 'Distrito Empresarial', cidade: 'Sao Paulo', estado: 'SP',
    });
    await this.garantir(this.enderecosUsina, { idUsina: usina.idUsina }, {
      idUsina: usina.idUsina, cep: '32000-000', rua: 'Rodovia Industrial', numero: '1000', bairro: 'Distrito Industrial', cidade: 'Contagem', estado: 'MG',
    });

    await this.garantir(this.funcionarios, { idEmpresa: empresa.idEmpresa }, {
      idEmpresa: empresa.idEmpresa, nome: 'Funcionario Demo', email: 'funcionario@demo.com', cargo: 'Comprador', tipoAcesso: 'operador', status: 'ativo',
    });
    await this.garantir(this.funcionarios, { idUsina: usina.idUsina }, {
      idUsina: usina.idUsina, nome: 'Tecnico Demo', email: 'tecnico@demo.com', cargo: 'Tecnico CNC', tipoAcesso: 'operador', status: 'ativo',
    });

    const pedidoExistente1 = await this.pedidos.findOne({ where: { numeroPedido: 'PED-DEMO-001' } });
    const pedido1 = pedidoExistente1 || await this.pedidos.save(this.pedidos.create({
      idEmpresaCompradora: empresa.idEmpresa, idUsuarioSolicitante: empresaUsuario.idUsuario, numeroPedido: 'PED-DEMO-001',
      urgencia: 'media', status: 'em_negociacao', observacoes: 'Eixo em aco carbono para demonstracao', prazoEntregaDias: 12, dataPedido: new Date(),
    }));
    if (!pedidoExistente1) {
      await this.itensPedido.save(this.itensPedido.create({
        idPedido: pedido1.idPedido, nome: 'Eixo estriado', categoria: 'Eixos', material: 'Aco 4140', quantidade: 40,
      }));
    }

    const pedidoExistente2 = await this.pedidos.findOne({ where: { numeroPedido: 'PED-DEMO-002' } });
    const pedido2 = pedidoExistente2 || await this.pedidos.save(this.pedidos.create({
      idEmpresaCompradora: empresa.idEmpresa, idUsuarioSolicitante: empresaUsuario.idUsuario, numeroPedido: 'PED-DEMO-002',
      urgencia: 'alta', status: 'aberto', observacoes: 'Flange inox para apresentacao', prazoEntregaDias: 8, dataPedido: new Date(),
    }));
    if (!pedidoExistente2) {
      await this.itensPedido.save(this.itensPedido.create({
        idPedido: pedido2.idPedido, nome: 'Flange inox', categoria: 'Flanges', material: 'Inox 304', quantidade: 25,
      }));
    }

    const proposta = await this.garantir(this.propostas, { idPedido: pedido1.idPedido, idUsina: usina.idUsina }, {
      idPedido: pedido1.idPedido, idUsina: usina.idUsina, idUsuarioResponsavel: usinaUsuario.idUsuario, valor: 2500, prazo: '10 dias', observacao: 'Entrega rapida para demo', status: 'enviada',
    });

    await this.garantir(this.avaliacoes, { idPedido: pedido1.idPedido }, {
      idPedido: pedido1.idPedido, idEmpresaAvaliadora: empresa.idEmpresa, idUsinaAvaliada: usina.idUsina, nota: 5, qualidade: 5, prazo: 4, comunicacao: 5, comentario: 'Excelente atendimento.',
    });
    await this.garantir(this.pagamentos, { idPedido: pedido1.idPedido }, {
      idPedido: pedido1.idPedido, idProposta: proposta.idProposta, idEmpresaPagadora: empresa.idEmpresa, idUsinaRecebedora: usina.idUsina, valor: 2500, status: 'pendente',
    });
    await this.garantir(this.notificacoes, { idUsuario: empresaUsuario.idUsuario }, {
      idUsuario: empresaUsuario.idUsuario, titulo: 'Proposta recebida', mensagem: 'Atlas Metais enviou uma proposta.', lida: false,
    });

    await this.garantir(this.solicitacoes, { idEmpresa: empresa.idEmpresa }, {
      idEmpresa: empresa.idEmpresa, peca: 'Engrenagem helicoidal', categoria: 'Engrenagens', material: 'Aco cementado', quantidade: 15,
      urgencia: 'media', localEntrega: 'Sao Paulo, SP', descricao: 'Solicitacao demo para testes.', status: 'aberta',
    });

    await this.garantir(this.solicitacoesComerciais, { idEmpresa: empresa.idEmpresa }, {
      idEmpresa: empresa.idEmpresa, peca: 'Bucha de bronze TM-23', fornecedor: 'Atlas Metais', valorUnitario: 145, quantidade: 2, status: 'registrada',
    });

    await this.garantir(this.pecasComerciais, { idUsina: usina.idUsina }, {
      idUsina: usina.idUsina, nome: 'Flange ANSI 150', material: 'Aco carbono ASTM A105', categoria: 'Flanges',
      descricao: 'Peca pronta em estoque para entrega rapida.', estoque: 42, unidadeEstoque: 'unidades', valorUnitario: 380, prazoEntregaDias: 3, ativo: true,
    });

    await this.garantir(this.solicitacoesBloqueio, { idEmpresa: empresa.idEmpresa }, {
      idEmpresa: empresa.idEmpresa, idUsina: usina.idUsina, motivo: 'Atraso recorrente na entrega',
      descricao: 'Solicitacao demo para testar o fluxo de bloqueio de usina.', status: 'pendente',
    });
  }
}
