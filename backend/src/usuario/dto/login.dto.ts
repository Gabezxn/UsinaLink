import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'E-mail invalido.' }) email: string;
  @IsNotEmpty({ message: 'Senha e obrigatoria.' }) @IsString() senha: string;
  @IsOptional() @IsString() tipo?: string;
}
