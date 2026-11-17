import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SessaoStripe {
  id: string;
  url?: string;
  payment_status?: string;
  status?: string;
  amount_total?: number;
  currency?: string;
  metadata?: Record<string, string>;
}

/**
 * Stripe Checkout sem biblioteca nova: so chamadas HTTPS para a API da Stripe.
 * Ligado quando STRIPE_SECRET_KEY existe (use a chave de TESTE, sk_test_..., para nao mexer em dinheiro de verdade).
 * STRIPE_API_BASE existe so para os testes automaticos apontarem para uma Stripe falsa local.
 */
@Injectable()
export class StripeService {
  private readonly log = new Logger('StripeService');
  constructor(private readonly config: ConfigService) {}

  ligado() {
    return !!this.config.get<string>('STRIPE_SECRET_KEY');
  }

  private base() {
    const alvo = this.config.get<string>('STRIPE_API_BASE');
    // A base alternativa so vale fora de producao.
    if (alvo && this.config.get<string>('NODE_ENV') !== 'production') return alvo.replace(/\/$/, '');
    return 'https://api.stripe.com';
  }

  private async chamar(metodo: 'GET' | 'POST', caminho: string, corpo?: URLSearchParams): Promise<any> {
    const chave = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!chave) throw new ServiceUnavailableException('Pagamento online nao configurado.');
    let resposta: Response;
    try {
      resposta = await fetch(`${this.base()}${caminho}`, {
        method: metodo,
        headers: { Authorization: `Bearer ${chave}`, ...(corpo ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
        body: corpo ? corpo.toString() : undefined,
        signal: AbortSignal.timeout(15_000),
      });
    } catch (erro) {
      this.log.error(`Stripe inacessivel: ${(erro as Error).message}`);
      throw new ServiceUnavailableException('Nao foi possivel falar com o servico de pagamento. Tente novamente.');
    }
    const dados: any = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      this.log.error(`Stripe recusou (HTTP ${resposta.status}): ${String(dados?.error?.message || '').slice(0, 200)}`);
      throw new ServiceUnavailableException('O servico de pagamento recusou a operacao. Tente novamente.');
    }
    return dados;
  }

  criarSessao(p: { valorCentavos: number; nome: string; sucesso: string; cancelado: string; email?: string; metadata: Record<string, string> }): Promise<SessaoStripe> {
    const f = new URLSearchParams();
    f.set('mode', 'payment');
    f.set('success_url', p.sucesso);
    f.set('cancel_url', p.cancelado);
    f.set('line_items[0][quantity]', '1');
    f.set('line_items[0][price_data][currency]', 'brl');
    f.set('line_items[0][price_data][unit_amount]', String(p.valorCentavos));
    f.set('line_items[0][price_data][product_data][name]', p.nome.slice(0, 120));
    if (p.email) f.set('customer_email', p.email);
    for (const [k, v] of Object.entries(p.metadata)) f.set(`metadata[${k}]`, v);
    return this.chamar('POST', '/v1/checkout/sessions', f);
  }

  buscarSessao(id: string): Promise<SessaoStripe> {
    return this.chamar('GET', `/v1/checkout/sessions/${encodeURIComponent(id)}`);
  }
}
