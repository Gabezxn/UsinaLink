import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateSolicitacaoDto {
  @IsNotEmpty({ message: 'Informe o nome da peça.' }) @IsString() peca: string;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsNumberString({}, { message: 'Quantidade deve ser numérica.' }) quantidade?: string;
  @IsOptional() @IsString() prazoDesejado?: string;
  @IsOptional() @IsString() urgencia?: string;
  @IsOptional() @IsString() localEntrega?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() arquivoTecnico?: string;
  @IsOptional() @IsString() arquivoTecnicoNome?: string;
}
