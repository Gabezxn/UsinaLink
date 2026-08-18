import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ResponderAvaliacaoDto {
  @IsNotEmpty({ message: 'Informe a resposta.' }) @IsString() respostaDaUsina: string;
  @IsOptional() @IsString() usinaId?: string;
}
