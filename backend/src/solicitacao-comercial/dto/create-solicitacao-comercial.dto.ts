import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateSolicitacaoComercialDto {
  @IsNotEmpty({ message: 'Informe a peça.' }) @IsString() peca: string;
  @IsOptional() @IsString() fornecedor?: string;
  @IsOptional() @IsNumberString({}, { message: 'Valor unitário deve ser numérico.' }) valorUnitario?: string;
  @IsOptional() @IsNumberString({}, { message: 'Quantidade deve ser numérica.' }) quantidade?: string;
}
