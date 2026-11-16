import { HttpException, HttpStatus, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { IsNull, LessThan, Repository } from 'typeorm';
import { CodigoDoisFatores } from '../common/entities/core.entities';
import { MailerService } from './mailer.service';
import { TokenService } from './token.service';

export const MAX_TENTATIVAS = 5;
export const MAX_REENVIOS = 3;

export function mascararEmail(email: string) {
  const [usuario = '', dominio = ''] = String(email).split('@');
  const visivel = usuario.slice(0, 2);
  return `${visivel}${'*'.repeat(Math.max(2, usuario.length - visivel.length))}@${dominio}`;
}

/**
 * Verificação em duas etapas por e-mail: depois da senha correta, o servidor manda um código de 6 dígitos.
 * Só com o código certo o token de acesso é emitido. O código vale poucos minutos, tem limite de tentativas,
 * serve uma única vez e fica no banco apenas como HMAC.
 * Ligado por TWO_FACTOR_ENABLED=true; TWO_FACTOR_SKIP_EMAILS (lista separada por vírgula) dispensa contas de demonstração.
 */
@Injectable()
export class TwoFactorService {
  private readonly log = new Logger('TwoFactorService');

  constructor(
    @InjectRepository(CodigoDoisFatores) private readonly codigos: Repository<CodigoDoisFatores>,
    private readonly mailer: MailerService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
  ) {
    if (this.ligado() && !this.mailer.configurado()) {
      this.log.warn('TWO_FACTOR_ENABLED=true, mas o envio de e-mail nao esta configurado (RESEND_API_KEY). Os logins vao falhar ate configurar.');
    }
  }

  private ligado() {
    return this.config.get<string>('TWO_FACTOR_ENABLED') === 'true';
  }

  private validadeMs() {
    return (Number(this.config.get<string>('TWO_FACTOR_TTL_SECONDS')) || 600) * 1000;
  }

  private intervaloReenvioMs() {
    const configurado = this.config.get<string>('TWO_FACTOR_RESEND_SECONDS');
    return (configurado !== undefined && configurado !== '' && Number.isFinite(Number(configurado)) ? Number(configurado) : 60) * 1000;
  }

  exigido(email: string) {
    if (!this.ligado()) return false;
    const dispensados = (this.config.get<string>('TWO_FACTOR_SKIP_EMAILS') || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    return !dispensados.includes(String(email).trim().toLowerCase());
  }

  private resumo(desafio: string, codigo: string) {
    return this.tokens.digest(`2fa:${desafio}:${codigo}`);
  }

  private iguais(a: string, b: string) {
    const ha = createHash('sha256').update(a).digest();
    const hb = createHash('sha256').update(b).digest();
    return timingSafeEqual(ha, hb);
  }

  private async enviarCodigo(email: string, codigo: string, minutos: number) {
    await this.mailer.enviar({
      to: email,
      subject: `Seu código de acesso Usinalink: ${codigo}`,
      text: `Seu código de verificação da Usinalink é ${codigo}.\n\nEle vale por ${minutos} minutos e só pode ser usado uma vez.\nSe não foi você que tentou entrar, ignore este e-mail e troque sua senha.`,
      html: `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:460px;margin:auto;padding:24px;color:#0f172a">
        <h2 style="margin:0 0 8px;color:#1e3a8a">Usinalink</h2>
        <p style="margin:0 0 16px">Use o código abaixo para concluir o seu acesso:</p>
        <p style="font-size:34px;letter-spacing:8px;font-weight:700;margin:0 0 16px;color:#1e3a8a">${codigo}</p>
        <p style="margin:0 0 8px;color:#475569">Ele vale por ${minutos} minutos e só pode ser usado uma vez.</p>
        <p style="margin:0;color:#475569">Se não foi você que tentou entrar, ignore este e-mail e troque sua senha.</p></div>`,
    });
  }

  /** Cria o desafio e envia o código. Falha fechada: sem e-mail enviado, não há login. */
  async iniciar(usuario: { idUsuario: number; email: string }, area: string) {
    await this.codigos.delete({ idUsuario: usuario.idUsuario, usadoEm: IsNull() }); // um desafio aberto por pessoa
    await this.codigos.delete({ expiraEm: LessThan(new Date(Date.now() - 24 * 3600 * 1000)) }); // faxina de antigos
    const desafio = randomBytes(24).toString('hex');
    const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const agora = Date.now();
    const registro = await this.codigos.save(this.codigos.create({
      desafio, idUsuario: usuario.idUsuario, area,
      codigoHash: this.resumo(desafio, codigo),
      enviadoEm: new Date(agora), expiraEm: new Date(agora + this.validadeMs()), tentativas: 0, reenvios: 0, usadoEm: null,
    }));
    try {
      await this.enviarCodigo(usuario.email, codigo, Math.round(this.validadeMs() / 60000) || 1);
    } catch (erro) {
      await this.codigos.delete({ idCodigo: registro.idCodigo });
      this.log.error(`Nao foi possivel enviar o codigo de verificacao: ${(erro as Error).message}`);
      throw new ServiceUnavailableException('Nao foi possivel enviar o codigo de verificacao. Tente novamente em instantes.');
    }
    return this.respostaDesafio(desafio, usuario.email, registro.expiraEm);
  }

  private respostaDesafio(desafio: string, email: string, expiraEm: Date) {
    return { requires2fa: true, desafio, email: mascararEmail(email), expiraEm: expiraEm.toISOString(), reenvioEmSegundos: Math.round(this.intervaloReenvioMs() / 1000) };
  }

  private async abertos(desafio: string) {
    const id = String(desafio || '');
    if (!/^[a-f0-9]{48}$/.test(id)) throw new UnauthorizedException('Codigo invalido ou expirado.');
    const registro = await this.codigos.findOne({ where: { desafio: id } });
    if (!registro || registro.usadoEm || registro.expiraEm.getTime() < Date.now()) throw new UnauthorizedException('Codigo invalido ou expirado.');
    return registro;
  }

  /** Confere o código. Devolve quem está entrando; o chamador emite o token. */
  async verificar(desafio: string, codigoInformado: string) {
    const registro = await this.abertos(desafio);
    const codigo = String(codigoInformado || '').replace(/\D/g, '');
    // Conta a tentativa antes de comparar (atômico): várias tentativas em paralelo não passam do limite.
    const contou = await this.codigos.createQueryBuilder().update(CodigoDoisFatores)
      .set({ tentativas: () => 'tentativas + 1' })
      .where('id_codigo = :id AND tentativas < :max AND usado_em IS NULL', { id: registro.idCodigo, max: MAX_TENTATIVAS }).execute();
    if (!contou.affected) {
      await this.codigos.update({ idCodigo: registro.idCodigo }, { usadoEm: new Date() }); // esgotado: invalida o desafio
      throw new UnauthorizedException('Muitas tentativas incorretas. Entre novamente.');
    }
    if (codigo.length !== 6 || !this.iguais(this.resumo(registro.desafio, codigo), registro.codigoHash)) {
      const restantes = Math.max(0, MAX_TENTATIVAS - (registro.tentativas + 1));
      throw new UnauthorizedException(restantes ? `Codigo incorreto. Restam ${restantes} tentativa(s).` : 'Codigo incorreto. Entre novamente.');
    }
    // Uso único: só um pedido consegue marcar como usado.
    const usou = await this.codigos.createQueryBuilder().update(CodigoDoisFatores)
      .set({ usadoEm: new Date() }).where('id_codigo = :id AND usado_em IS NULL', { id: registro.idCodigo }).execute();
    if (!usou.affected) throw new UnauthorizedException('Codigo invalido ou expirado.');
    return { idUsuario: registro.idUsuario, area: registro.area };
  }

  /** Novo código para o mesmo desafio: com intervalo mínimo e no máximo 3 reenvios. */
  async reenviar(desafio: string, usuario: { idUsuario: number; email: string }) {
    const registro = await this.abertos(desafio);
    if (registro.idUsuario !== usuario.idUsuario) throw new UnauthorizedException('Codigo invalido ou expirado.');
    const espera = this.intervaloReenvioMs() - (Date.now() - registro.enviadoEm.getTime());
    if (espera > 0) throw new HttpException(`Aguarde ${Math.ceil(espera / 1000)} segundos para pedir outro codigo.`, HttpStatus.TOO_MANY_REQUESTS);
    if (registro.reenvios >= MAX_REENVIOS) throw new HttpException('Limite de reenvios atingido. Entre novamente.', HttpStatus.TOO_MANY_REQUESTS);
    const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const agora = Date.now();
    registro.codigoHash = this.resumo(registro.desafio, codigo);
    registro.enviadoEm = new Date(agora);
    registro.expiraEm = new Date(agora + this.validadeMs());
    registro.tentativas = 0;
    registro.reenvios += 1;
    await this.codigos.save(registro);
    try {
      await this.enviarCodigo(usuario.email, codigo, Math.round(this.validadeMs() / 60000) || 1);
    } catch (erro) {
      this.log.error(`Nao foi possivel reenviar o codigo: ${(erro as Error).message}`);
      throw new ServiceUnavailableException('Nao foi possivel enviar o codigo de verificacao. Tente novamente em instantes.');
    }
    return this.respostaDesafio(registro.desafio, usuario.email, registro.expiraEm);
  }

  /** Quem é o dono do desafio (para reenviar sem pedir a senha de novo). */
  async dono(desafio: string) {
    return (await this.abertos(desafio)).idUsuario;
  }
}
