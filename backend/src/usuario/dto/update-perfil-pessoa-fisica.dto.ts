import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePerfilPessoaFisicaDto {
  @IsOptional() @IsString() @MinLength(2, { message: 'Informe o nome completo.' }) nome?: string;
  @IsOptional() @IsEmail({}, { message: 'E-mail inválido.' }) email?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() @MaxLength(12) cep?: string;
  @IsOptional() @IsString() @MaxLength(200) rua?: string;
  @IsOptional() @IsString() @MaxLength(20) numero?: string;
  @IsOptional() @IsString() @MaxLength(100) complemento?: string;
  @IsOptional() @IsString() @MaxLength(100) bairro?: string;
  @IsOptional() @IsString() @MaxLength(120) cidade?: string;
  @IsOptional() @IsString() @MaxLength(4) estado?: string;
}
