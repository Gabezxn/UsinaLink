import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class EsqueciSenhaDto {
  @IsEmail({}, { message: 'E-mail invalido.' }) email: string;
  @IsOptional() @IsString() @MaxLength(200) origem?: string;
}

export class RedefinirSenhaDto {
  @IsString() @Length(64, 64, { message: 'Link invalido.' }) token: string;
  @MinLength(6, { message: 'Nova senha deve ter no minimo 6 caracteres.' }) @MaxLength(100) novaSenha: string;
  @IsNotEmpty({ message: 'Confirme a nova senha.' }) @IsString() confirmarSenha: string;
}
