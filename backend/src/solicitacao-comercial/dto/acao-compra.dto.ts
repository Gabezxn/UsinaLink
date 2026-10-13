import { IsIn, IsOptional, IsString } from 'class-validator';

export const ACOES_COMPRA = ['aceitar', 'recusar', 'pagar', 'separar', 'enviar', 'confirmar_entrega', 'cancelar'] as const;
export type AcaoCompra = (typeof ACOES_COMPRA)[number];

export class AcaoCompraDto {
  @IsIn(ACOES_COMPRA as unknown as string[], { message: 'Acao invalida.' }) acao: AcaoCompra;
  @IsOptional() @IsString() metodo?: string;
  @IsOptional() @IsString() observacao?: string;
}
