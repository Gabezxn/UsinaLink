import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreatePecaComercialDto {
  @IsNotEmpty({ message: 'Informe o nome da peça.' }) @IsString() nome: string;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsNumberString({}, { message: 'Estoque deve ser numérico.' }) estoque?: string;
  @IsOptional() @IsString() unidadeEstoque?: string;
  @IsOptional() @IsNumberString({}, { message: 'Valor unitário deve ser numérico.' }) valorUnitario?: string;
  @IsOptional() @IsNumberString({}, { message: 'Prazo de entrega deve ser numérico.' }) prazoEntregaDias?: string;
}
