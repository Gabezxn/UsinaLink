import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdatePerfilPessoaFisicaDto {
  @IsOptional() @IsString() @MinLength(2, { message: 'Informe o nome completo.' }) nome?: string;
  @IsOptional() @IsEmail({}, { message: 'E-mail inválido.' }) email?: string;
  @IsOptional() @IsString() telefone?: string;
}
