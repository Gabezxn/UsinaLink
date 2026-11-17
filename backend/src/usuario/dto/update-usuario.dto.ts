import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateUsuarioDto {
  @IsOptional() @IsString() @MaxLength(200) nome?: string;
  @IsOptional() @IsEmail({}, { message: 'E-mail invalido.' }) email?: string;
  @IsOptional() @MinLength(6, { message: 'Senha deve ter no minimo 6 caracteres.' }) senha?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsString() @MaxLength(200) cargo?: string;
  @IsOptional() @IsString() @MaxLength(200) responsavel?: string;
  @IsOptional() @IsString() especialidade?: string;
}
