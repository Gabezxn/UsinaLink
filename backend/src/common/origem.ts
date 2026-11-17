import { ConfigService } from '@nestjs/config';

/** Enderecos do site aceitos como destino de links e retornos (nunca um endereco qualquer vindo do navegador). */
export function origemPermitida(config: ConfigService, origem?: string) {
  if (!origem) return false;
  const fixas = (config.get<string>('ALLOWED_ORIGINS', 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000') || '').split(',').map(o => o.trim()).filter(Boolean);
  return fixas.includes(origem) || /^https:\/\/(www\.)?usinalink\.com\.br$/.test(origem) || /^https:\/\/[a-z0-9-]+-usinalink\.tibiel2010\.workers\.dev$/.test(origem);
}
