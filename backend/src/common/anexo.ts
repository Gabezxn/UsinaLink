import { applyDecorators } from '@nestjs/common';
import { Matches, MaxLength } from 'class-validator';

/** Anexo enviado como data URL: só PDF, imagem ou desenho técnico (DWG), até ~6 MB de arquivo. */
export const ANEXO_REGEX = /^data:(application\/pdf|application\/octet-stream|application\/acad|application\/x-acad|image\/vnd\.dwg|image\/(png|jpe?g|webp|gif));base64,[A-Za-z0-9+/=]+$/;
export const ANEXO_MAX_CHARS = 8_000_000;

export function isAnexoSeguro(valor: unknown): boolean {
  return typeof valor === 'string' && valor.length <= ANEXO_MAX_CHARS && ANEXO_REGEX.test(valor);
}

export const IMAGEM_REGEX = /^(data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+|https:\/\/[^\s"'<>]+)$/;

/** Decorator para imagem de peça: data URL de imagem ou URL https. */
export function IsImagem() {
  return applyDecorators(
    MaxLength(ANEXO_MAX_CHARS, { message: 'Imagem grande demais.' }),
    Matches(IMAGEM_REGEX, { message: 'Imagem inválida. Envie PNG ou JPG.' }),
  );
}

/** Decorator para campos de anexo nos DTOs (rejeita javascript:, data:text/html, atributos injetados e anexos gigantes). */
export function IsAnexo() {
  return applyDecorators(
    MaxLength(ANEXO_MAX_CHARS, { message: 'Arquivo grande demais (máximo de aproximadamente 6 MB).' }),
    Matches(ANEXO_REGEX, { message: 'Arquivo inválido. Envie PDF, imagem (PNG/JPG) ou desenho técnico.' }),
  );
}
