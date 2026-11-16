import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

export interface Email { to: string; subject: string; text: string; html?: string }

/**
 * Envio de e-mail sem dependências novas.
 *  - resend (produção): API HTTPS do Resend (plano gratuito). Precisa de RESEND_API_KEY e, para enviar a qualquer pessoa,
 *    de um remetente em domínio verificado (MAIL_FROM, ex.: "Usinalink <nao-responda@usinalink.com.br>").
 *  - file / console: só para desenvolvimento e testes (MAIL_TRANSPORT=file com MAIL_OUTBOX_DIR). Bloqueados com NODE_ENV=production.
 */
@Injectable()
export class MailerService {
  private readonly log = new Logger('MailerService');
  constructor(private readonly config: ConfigService) {}

  transporte(): 'resend' | 'file' | 'console' | 'none' {
    const escolhido = (this.config.get<string>('MAIL_TRANSPORT') || '').toLowerCase();
    const producao = this.config.get<string>('NODE_ENV') === 'production';
    if ((escolhido === 'file' || escolhido === 'console') && !producao) return escolhido;
    if (this.config.get<string>('RESEND_API_KEY')) return 'resend';
    return 'none';
  }

  configurado() {
    return this.transporte() !== 'none';
  }

  async enviar(email: Email) {
    const via = this.transporte();
    if (via === 'resend') return this.viaResend(email);
    if (via === 'file') return this.viaArquivo(email);
    if (via === 'console') { this.log.log(`E-mail para ${email.to}: ${email.subject}\n${email.text}`); return; }
    throw new Error('Envio de e-mail nao configurado (defina RESEND_API_KEY).');
  }

  private async viaResend(email: Email) {
    const chave = this.config.get<string>('RESEND_API_KEY') as string;
    const from = this.config.get<string>('MAIL_FROM') || 'Usinalink <onboarding@resend.dev>';
    const resposta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!resposta.ok) {
      // Nunca registra o corpo do e-mail (contém o código); só o status e a mensagem do provedor.
      const detalhe = await resposta.text().catch(() => '');
      this.log.error(`Resend recusou o envio (HTTP ${resposta.status}): ${detalhe.slice(0, 200)}`);
      throw new Error(`Falha ao enviar e-mail (HTTP ${resposta.status}).`);
    }
  }

  private viaArquivo(email: Email) {
    const pasta = this.config.get<string>('MAIL_OUTBOX_DIR');
    if (!pasta) throw new Error('MAIL_OUTBOX_DIR nao definido.');
    mkdirSync(pasta, { recursive: true });
    writeFileSync(join(pasta, `${Date.now()}-${randomBytes(4).toString('hex')}.json`), JSON.stringify(email, null, 2));
  }
}
