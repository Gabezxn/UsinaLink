import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import { Usuario, PessoaFisica, Empresa, Usina, Funcionario, Pedido, Proposta, AvaliacaoEntrega, Pagamento, Notificacao } from '../common/entities/core.entities';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(PessoaFisica) private readonly pessoasFisicas: Repository<PessoaFisica>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    @InjectRepository(Funcionario) private readonly funcionarios: Repository<Funcionario>,
    @InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>,
    @InjectRepository(Proposta) private readonly propostas: Repository<Proposta>,
    @InjectRepository(AvaliacaoEntrega) private readonly avaliacoes: Repository<AvaliacaoEntrega>,
    @InjectRepository(Pagamento) private readonly pagamentos: Repository<Pagamento>,
    @InjectRepository(Notificacao) private readonly notificacoes: Repository<Notificacao>,
    private readonly passwords: PasswordService,
  ) {}

  async onModuleInit() {
    const existentes = await this.usuarios.count();
    if (existentes > 0) return;

    const senhaHash = await this.passwords.hash('Demo@123');

    const empresaUsuario = await this.usuarios.save(this.usuarios.create({ nome: 'Metal Forte Ltda.', email: 'empresa@demo.com', senhaHash, tipoUsuario: 'empresa', status: 'ativo' }));
    const usinaUsuario = await this.usuarios.save(this.usuarios.create({ nome: 'Atlas Metais', email: 'usina@demo.com', senhaHash, tipoUsuario: 'usina', status: 'ativo' }));
    const pessoaUsuario = await this.usuarios.save(this.usuarios.create({ nome: 'Joao Demo', email: 'pessoa@demo.com', senhaHash, tipoUsuario: 'pessoa_fisica', status: 'ativo' }));
    await this.usuarios.save(this.usuarios.create({ nome: 'Administrador Demo', email: 'admin@demo.com', senhaHash, tipoUsuario: 'admin', status: 'ativo' }));

    const empresa = await this.empresas.save(this.empresas.create({
      idUsuario: empresaUsuario.idUsuario, razaoSocial: 'Metal Forte Ltda.', nomeFantasia: 'Metal Forte', cnpj: '11222333000181',
      email: empresaUsuario.email, telefone: '11999990000', responsavel: 'Maria Compras', cargoResponsavel: 'Gerente', statusValidacao: 'aprovado',
    }));
    const usina = await this.usinas.save(this.usinas.create({
      idUsuario: usinaUsuario.idUsuario, razaoSocial: 'Atlas Metais Ltda.', nomeFantasia: 'Atlas Metais', cnpj: '22333444000191',
      email: usinaUsuario.email, telefone: '21999990000', responsavel: 'Carlos Tecnico', especialidade: 'Usinagem de precisao', statusValidacao: 'aprovado',
    }));
    await this.pessoasFisicas.save(this.pessoasFisicas.create({
      idUsuario: pessoaUsuario.idUsuario, nome: pessoaUsuario.nome, cpf: '12345678909', email: pessoaUsuario.email, telefone: '31999990000',
    }));
    await this.funcionarios.save(this.funcionarios.create({
      idEmpresa: empresa.idEmpresa, nome: 'Funcionario Demo', email: 'funcionario@demo.com', cargo: 'Comprador', tipoAcesso: 'operador', status: 'ativo',
    }));

    const pedido1 = await this.pedidos.save(this.pedidos.create({
      idEmpresaCompradora: empresa.idEmpresa, idUsuarioSolicitante: empresaUsuario.idUsuario, numeroPedido: 'PED-DEMO-001',
      urgencia: 'media', status: 'em_negociacao', observacoes: 'Eixo em aco carbono para demonstracao', dataPedido: new Date(),
    }));
    await this.pedidos.save(this.pedidos.create({
      idEmpresaCompradora: empresa.idEmpresa, idUsuarioSolicitante: empresaUsuario.idUsuario, numeroPedido: 'PED-DEMO-002',
      urgencia: 'alta', status: 'aberto', observacoes: 'Flange inox para apresentacao', dataPedido: new Date(),
    }));
    const proposta = await this.propostas.save(this.propostas.create({
      idPedido: pedido1.idPedido, idUsina: usina.idUsina, idUsuarioResponsavel: usinaUsuario.idUsuario, valor: 2500, prazo: '10 dias', observacao: 'Entrega rapida para demo', status: 'enviada',
    }));
    await this.avaliacoes.save(this.avaliacoes.create({
      idPedido: pedido1.idPedido, idEmpresaAvaliadora: empresa.idEmpresa, idUsinaAvaliada: usina.idUsina, nota: 5, comentario: 'Excelente atendimento.',
    }));
    await this.pagamentos.save(this.pagamentos.create({
      idPedido: pedido1.idPedido, idProposta: proposta.idProposta, idEmpresaPagadora: empresa.idEmpresa, idUsinaRecebedora: usina.idUsina, valor: 2500, status: 'pendente',
    }));
    await this.notificacoes.save(this.notificacoes.create({
      idUsuario: empresaUsuario.idUsuario, titulo: 'Proposta recebida', mensagem: 'Atlas Metais enviou uma proposta.', lida: false,
    }));
  }
}
