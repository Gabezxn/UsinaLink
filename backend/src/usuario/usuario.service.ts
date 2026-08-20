import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import { TokenService } from '../auth/token.service';
import { Usuario, Empresa, Usina, PessoaFisica, Funcionario, BloqueioUsina } from '../common/entities/core.entities';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';

const digits = (v: any) => String(v || '').replace(/\D/g, '');
const mail = (v: any) => String(v || '').trim().toLowerCase();
type TipoLogin = 'empresa' | 'usina' | 'pessoa_fisica';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    @InjectRepository(PessoaFisica) private readonly pessoasFisicas: Repository<PessoaFisica>,
    @InjectRepository(Funcionario) private readonly funcionarios: Repository<Funcionario>,
    @InjectRepository(BloqueioUsina) private readonly bloqueios: Repository<BloqueioUsina>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  private safe(u: any) {
    if (!u) return u;
    const { senhaHash, senha, confirmarSenha, confirmar_senha, ...safe } = u;
    return safe;
  }

  async buscarPorId(idUsuario: number) {
    const u = await this.usuarios.findOne({ where: { idUsuario } });
    return u && this.safe(u);
  }

  async buscarPorEmail(email: string) {
    const u = await this.usuarios.findOne({ where: { email: mail(email) } });
    return u && this.safe(u);
  }

  buscarPorTipo(tipoUsuario: string) {
    return this.usuarios.find({ where: { tipoUsuario } }).then(rows => rows.map(u => this.safe(u)));
  }

  buscarPorStatus(status: string) {
    return this.usuarios.find({ where: { status } }).then(rows => rows.map(u => this.safe(u)));
  }

  buscarEmailComSenha(email: string) {
    return this.usuarios.createQueryBuilder('u').addSelect('u.senhaHash').where('u.email = :email', { email: mail(email) }).getOne();
  }

  private mensagemTipo(tipoUsuario: string) {
    if (tipoUsuario === 'empresa') return 'Esta conta pertence a uma empresa.';
    if (tipoUsuario === 'usina') return 'Esta conta pertence a uma usina.';
    if (tipoUsuario === 'pessoa_fisica') return 'Esta conta pertence a uma pessoa fisica.';
    return 'Esta conta nao pertence a esta area de login.';
  }

  async cadastrar(dto: CreateUsuarioDto, tipoUsuario: TipoLogin) {
    const email = mail(dto.email);
    const cnpj = digits((dto as any).cnpj);
    const cpf = digits((dto as any).cpf);
    const telefone = digits((dto as any).telefone);
    const senha = String((dto as any).senha || '');
    const confirmar = String((dto as any).confirmarSenha || (dto as any).confirmar_senha || '');

    if (!email || !senha || senha.length < 6) throw new BadRequestException('E-mail e senha com no minimo 6 caracteres sao obrigatorios.');
    if (confirmar && senha !== confirmar) throw new BadRequestException('Senha e confirmacao devem ser iguais.');
    if (tipoUsuario === 'pessoa_fisica') {
      if (!String((dto as any).nome || '').trim()) throw new BadRequestException('Nome e obrigatorio.');
      if (cpf.length !== 11) throw new BadRequestException('CPF invalido.');
    } else if (cnpj.length !== 14) {
      throw new BadRequestException('CNPJ invalido.');
    }

    if (await this.usuarios.findOne({ where: { email } })) throw new ConflictException('E-mail já cadastrado.');
    if (tipoUsuario === 'empresa' && await this.empresas.findOne({ where: { cnpj } })) throw new ConflictException('CNPJ já cadastrado.');
    if (tipoUsuario === 'usina' && await this.usinas.findOne({ where: { cnpj } })) throw new ConflictException('CNPJ já cadastrado.');
    if (tipoUsuario === 'pessoa_fisica' && await this.pessoasFisicas.findOne({ where: { cpf } })) throw new ConflictException('CPF já cadastrado.');

    const senhaHash = await this.passwords.hash(senha);

    const usuario = await this.dataSource.transaction(async manager => {
      const novoUsuario = await manager.save(Usuario, manager.create(Usuario, {
        nome: (dto as any).nome || (dto as any).razaoSocial,
        email,
        senhaHash,
        tipoUsuario,
        status: 'ativo',
      }));

      if (tipoUsuario === 'pessoa_fisica') {
        await manager.save(PessoaFisica, manager.create(PessoaFisica, {
          idUsuario: novoUsuario.idUsuario, nome: novoUsuario.nome, cpf, email, telefone,
        }));
      } else {
        const base = {
          idUsuario: novoUsuario.idUsuario, cnpj, email, telefone,
          razaoSocial: (dto as any).razaoSocial || (dto as any).nome,
          nomeFantasia: (dto as any).nomeFantasia || (dto as any).nome,
          responsavel: (dto as any).responsavel,
          statusValidacao: 'pendente',
        };
        if (tipoUsuario === 'empresa') {
          await manager.save(Empresa, manager.create(Empresa, { ...base, cargoResponsavel: (dto as any).cargo }));
        }
        if (tipoUsuario === 'usina') {
          await manager.save(Usina, manager.create(Usina, { ...base, especialidade: (dto as any).especialidade }));
        }
      }
      return novoUsuario;
    });

    return { message: 'Cadastro realizado com sucesso.', usuario: this.safe(usuario) };
  }

  async loginArea(dto: LoginDto, area: TipoLogin) {
    const usuario = await this.buscarEmailComSenha(dto.email);
    if (!usuario) throw new UnauthorizedException('Usuário não encontrado.');
    if (usuario.status && usuario.status !== 'ativo') throw new ForbiddenException('Usuario inativo.');
    if (!await this.passwords.compare(String(dto.senha || ''), usuario.senhaHash)) throw new UnauthorizedException('E-mail ou senha inválidos.');

    let vinculo: any = null;
    if (area === 'pessoa_fisica') {
      if (usuario.tipoUsuario !== 'pessoa_fisica') throw new ForbiddenException(this.mensagemTipo(usuario.tipoUsuario));
      vinculo = await this.pessoasFisicas.findOne({ where: { idUsuario: usuario.idUsuario } });
    } else {
      if (usuario.tipoUsuario === area) {
        vinculo = area === 'empresa'
          ? await this.empresas.findOne({ where: { idUsuario: usuario.idUsuario } })
          : await this.usinas.findOne({ where: { idUsuario: usuario.idUsuario } });
      }
      if (!vinculo) {
        const f = await this.funcionarios.findOne({ where: { idUsuario: usuario.idUsuario, status: 'ativo' } });
        if (f && ((area === 'empresa' && f.idEmpresa) || (area === 'usina' && f.idUsina))) vinculo = f;
      }
      if (!vinculo) throw new ForbiddenException(this.mensagemTipo(usuario.tipoUsuario));
      if (area === 'usina') {
        const idUsina = (vinculo as Usina).idUsina ?? (vinculo as Funcionario).idUsina;
        if (await this.bloqueios.findOne({ where: { idUsina, ativo: true } })) throw new ForbiddenException('Usina bloqueada.');
      }
    }

    const accessToken = this.tokens.sign({ sub: usuario.idUsuario, tipoUsuario: usuario.tipoUsuario });
    const response: any = { accessToken, access_token: accessToken, tipoUsuario: usuario.tipoUsuario, nome: usuario.nome, usuario: this.safe(usuario) };
    if (area !== 'pessoa_fisica') response[area] = vinculo;
    return response;
  }

  async trocarSenha(user: any, dto: { senhaAtual: string; novaSenha: string; confirmarSenha: string }) {
    if (!dto.novaSenha || dto.novaSenha.length < 6) throw new BadRequestException('Nova senha deve ter no minimo 6 caracteres.');
    if (dto.novaSenha !== dto.confirmarSenha) throw new BadRequestException('A nova senha e a confirmacao nao coincidem.');
    const usuario = await this.usuarios.createQueryBuilder('u').addSelect('u.senhaHash').where('u.idUsuario = :id', { id: user.sub }).getOne();
    if (!usuario) throw new BadRequestException('Usuário não encontrado.');
    if (!await this.passwords.compare(String(dto.senhaAtual || ''), usuario.senhaHash)) throw new BadRequestException('Senha atual incorreta.');
    const senhaHash = await this.passwords.hash(dto.novaSenha);
    await this.usuarios.update({ idUsuario: user.sub }, { senhaHash });
    return { message: 'Senha atualizada com sucesso.' };
  }

  async loginAdmin(dto: LoginDto) {
    const usuario = await this.buscarEmailComSenha(dto.email);
    if (!usuario) throw new UnauthorizedException('Usuário não encontrado.');
    if (usuario.tipoUsuario !== 'admin') throw new ForbiddenException('Esta conta nao e de administrador.');
    if (usuario.status && usuario.status !== 'ativo') throw new ForbiddenException('Usuario inativo.');
    if (!await this.passwords.compare(String(dto.senha || ''), usuario.senhaHash)) throw new UnauthorizedException('E-mail ou senha inválidos.');
    const accessToken = this.tokens.sign({ sub: usuario.idUsuario, tipoUsuario: usuario.tipoUsuario });
    return { accessToken, access_token: accessToken, tipoUsuario: usuario.tipoUsuario, nome: usuario.nome, usuario: this.safe(usuario) };
  }
}
