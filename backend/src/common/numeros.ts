import { applyDecorators } from '@nestjs/common';
import { Matches, MaxLength, ValidateBy, buildMessage } from 'class-validator';

/** Numero em texto (ex.: "12.5"): so digitos e ponto decimal, sem sinal. */
const NUMERO_REGEX = /^\d{1,12}(\.\d{1,4})?$/;

/** Valor numerico maior que zero (preco, quantidade). */
export function IsPositivoTexto(mensagem: string) {
  return applyDecorators(
    Matches(NUMERO_REGEX, { message: mensagem }),
    ValidateBy({ name: 'isPositivoTexto', validator: { validate: (v) => Number(v) > 0, defaultMessage: buildMessage(() => mensagem) } }),
  );
}

/** Valor numerico zero ou maior (frete, estoque). */
export function IsNaoNegativoTexto(mensagem: string) {
  return Matches(NUMERO_REGEX, { message: mensagem });
}

/** Quantidade: numero inteiro maior que zero. */
export function IsInteiroPositivoTexto(mensagem: string) {
  return Matches(/^[1-9]\d{0,8}$/, { message: mensagem });
}

/** Data (AAAA-MM-DD) real e de hoje em diante. */
export function IsDataFutura(mensagem: string) {
  return ValidateBy({
    name: 'isDataFutura',
    validator: {
      validate: (v) => {
        if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
        const d = new Date(`${v}T00:00:00Z`);
        if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return false;
        const hoje = new Date(); hoje.setUTCHours(0, 0, 0, 0);
        return d.getTime() >= hoje.getTime() - 24 * 3600 * 1000;
      },
      defaultMessage: buildMessage(() => mensagem),
    },
  });
}

/** Urgencia aceita nos formularios (com ou sem acento, qualquer caixa). */
export function IsUrgencia() {
  return applyDecorators(
    MaxLength(20),
    Matches(/^(baixa|normal|m[eé]dia|alta|cr[ií]tica)$/i, { message: 'Urgência inválida.' }),
  );
}
