import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario, Empresa, Usina, Funcionario } from '../common/entities/core.entities';

@Injectable()
export class ContextoUsuarioService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(Usina) private readonly usinas: Repository<Usina>,
    @InjectRepository(Funcionario) private readonly funcionarios: Repository<Funcionario>,
  ) {}

  // Conta de empresa/usina cujo registro perdeu o id_usuario (cadastro antigo ou migrado): acha pelo
  // e-mail do usuario e religa o registro, em vez de exigir que exista um funcionario ativo.
  private async religarPorEmail<T extends { idUsuario?: number | null }>(repo: Repository<T>, idUsuario: number, tipo: string): Promise<T | null> {
    const usuario = await this.usuarios.findOne({ where: { idUsuario } });
    if (!usuario || usuario.tipoUsuario !== tipo || !usuario.email) return null;
    const registro = await repo.findOne({ where: { email: usuario.email } as any });
    if (!registro || (registro.idUsuario && registro.idUsuario !== idUsuario)) return null;
    if (!registro.idUsuario) await repo.update({ email: usuario.email } as any, { idUsuario } as any);
    return registro;
  }

  async obterEmpresaId(idUsuario: number): Promise<number> {
    const empresa = await this.empresas.findOne({ where: { idUsuario } });
    if (empresa) return empresa.idEmpresa;
    const funcionario = await this.funcionarios.findOne({ where: { idUsuario, status: 'ativo' } });
    if (funcionario?.idEmpresa) return funcionario.idEmpresa;
    const religada = await this.religarPorEmail(this.empresas, idUsuario, 'empresa');
    if (religada) return religada.idEmpresa;
    throw new ForbiddenException('Usuario sem vinculo ativo com empresa.');
  }

  async obterUsinaId(idUsuario: number): Promise<number> {
    const usina = await this.usinas.findOne({ where: { idUsuario } });
    if (usina) return usina.idUsina;
    const funcionario = await this.funcionarios.findOne({ where: { idUsuario, status: 'ativo' } });
    if (funcionario?.idUsina) return funcionario.idUsina;
    const religada = await this.religarPorEmail(this.usinas, idUsuario, 'usina');
    if (religada) return religada.idUsina;
    throw new ForbiddenException('Usuario sem vinculo ativo com usina.');
  }
}
