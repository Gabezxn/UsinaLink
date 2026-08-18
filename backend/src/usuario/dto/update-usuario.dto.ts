import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsEmail({}, { message: 'E-mail invalido.' }) email?: string;
  @IsOptional() @MinLength(6, { message: 'Senha deve ter no minimo 6 caracteres.' }) senha?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() cargo?: string;
  @IsOptional() @IsString() responsavel?: string;
  @IsOptional() @IsString() especialidade?: string;
}
