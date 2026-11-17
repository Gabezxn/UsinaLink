import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { IsNull, LessThan, Repository } from 'typeorm';
import { origemPermitida } from '../common/origem';
import { RedefinicaoSenha, Usuario } from '../common/entities/core.entities';
import { MailerService } from './mailer.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

const VALIDADE_MS = 30 * 60 * 1000;
const INTERVALO_MS = 60 * 1000;
const MENSAGEM_PEDIDO = 'Se esse e-mail tiver cadastro, enviamos um link para criar uma nova senha. Ele vale por 30 minutos.';

/**
 * Esqueci minha senha: o link com um codigo longo e aleatorio vai so para o e-mail da conta.
 * O banco guarda apenas o HMAC do codigo, que vale 30 minutos e uma unica vez. A resposta do pedido e sempre a mesma,
 * exista a conta ou nao, para ninguem descobrir quem tem cadastro.
 */
@Injectable()
export class RedefinicaoSenhaService {
  private readonly log = new Logger('RedefinicaoSenhaService');

  constructor(
    @InjectRepository(RedefinicaoSenha) private readonly pedidos: Repository<RedefinicaoSenha>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly mailer: MailerService,
    private readonly senhas: PasswordService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {}

  private resumo(token: string) {
    return this.tokens.digest(`reset:${token}`);
  }

  async solicitar(email: string, origem?: string) {
    const usuario = await this.usuarios.findOne({ where: { email: String(email).trim().toLowerCase() } });
    if (!usuario || (usuario.status && usuario.status !== 'ativo')) return { mensagem: MENSAGEM_PEDIDO };
    const recente = await this.pedidos.findOne({ where: { idUsuario: usuario.idUsuario, usadoEm: IsNull() }, order: { dataCriacao: 'DESC' } });
    if (recente && Date.now() - recente.dataCriacao.getTime() < INTERVALO_MS) return { mensagem: MENSAGEM_PEDIDO };

    await this.pedidos.delete({ idUsuario: usuario.idUsuario, usadoEm: IsNull() }); // so o link mais novo vale
    await this.pedidos.delete({ expiraEm: LessThan(new Date(Date.now() - 24 * 3600 * 1000)) });
    const token = randomBytes(32).toString('hex');
    const registro = await this.pedidos.save(this.pedidos.create({ idUsuario: usuario.idUsuario, tokenHash: this.resumo(token), expiraEm: new Date(Date.now() + VALIDADE_MS), usadoEm: null }));
    const base = origemPermitida(this.config, origem) ? (origem as string) : 'https://usinalink.com.br';
    const link = `${base}/redefinir-senha.html#token=${token}`;
    try {
      await this.mailer.enviar({
        to: usuario.email,
        subject: 'Criar nova senha na Usinalink',
        text: `Recebemos um pedido para criar uma nova senha na Usinalink.\n\nAbra o link (vale por 30 minutos e só funciona uma vez):\n${link}\n\nSe não foi você, ignore este e-mail: sua senha continua a mesma.`,
        html: `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:460px;margin:auto;padding:24px;color:#0f172a">
          <h2 style="margin:0 0 8px;color:#1e3a8a">Usinalink</h2>
          <p style="margin:0 0 16px">Recebemos um pedido para criar uma nova senha.</p>
          <p style="margin:0 0 20px"><a href="${link}" style="display:inline-block;padding:12px 20px;background:#1e3a8a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Criar nova senha</a></p>
          <p style="margin:0 0 8px;color:#475569">O link vale por 30 minutos e só funciona uma vez.</p>
          <p style="margin:0;color:#475569">Se não foi você, ignore este e-mail: sua senha continua a mesma.</p></div>`,
      });
    } catch (erro) {
      await this.pedidos.delete({ idRedefinicao: registro.idRedefinicao });
      this.log.error(`Nao foi possivel enviar o e-mail de nova senha: ${(erro as Error).message}`);
    }
    return { mensagem: MENSAGEM_PEDIDO };
  }

  async redefinir(token: string, novaSenha: string, confirmarSenha: string) {
    if (novaSenha !== confirmarSenha) throw new BadRequestException('A nova senha e a confirmacao nao coincidem.');
    const registro = await this.pedidos.findOne({ where: { tokenHash: this.resumo(String(token || '')) } });
    if (!registro || registro.usadoEm || registro.expiraEm.getTime() < Date.now()) throw new BadRequestException('Este link expirou ou ja foi usado. Peca um novo.');
    // Uso unico: so um pedido consegue marcar como usado.
    const usou = await this.pedidos.createQueryBuilder().update(RedefinicaoSenha)
      .set({ usadoEm: new Date() }).where('id_redefinicao = :id AND usado_em IS NULL', { id: registro.idRedefinicao }).execute();
    if (!usou.affected) throw new BadRequestException('Este link expirou ou ja foi usado. Peca um novo.');
    await this.usuarios.update({ idUsuario: registro.idUsuario }, { senhaHash: await this.senhas.hash(novaSenha) });
    return { mensagem: 'Senha alterada. Entre com a nova senha.' };
  }
}
