import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsString() type?: string;
  @IsNotEmpty({ message: 'Nome e obrigatorio.' }) @IsString() nome: string;
  @IsEmail({}, { message: 'E-mail invalido.' }) email: string;
  @MinLength(6, { message: 'Senha deve ter no minimo 6 caracteres.' }) senha: string;
  @IsOptional() @IsString() confirmarSenha?: string;
  @IsOptional() @IsString() confirmar_senha?: string;
  @IsOptional() @IsString() cpf?: string;
  @IsOptional() @IsString() cnpj?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() cargo?: string;
  @IsOptional() @IsString() responsavel?: string;
  @IsOptional() @IsString() especialidade?: string;
}
