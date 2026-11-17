import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class TrocarSenhaDto {
  @IsNotEmpty({ message: 'Informe a senha atual.' }) @IsString() senhaAtual: string;
  @MinLength(6, { message: 'Nova senha deve ter no minimo 6 caracteres.' }) novaSenha: string;
  @IsNotEmpty({ message: 'Confirme a nova senha.' }) @IsString() confirmarSenha: string;
}
