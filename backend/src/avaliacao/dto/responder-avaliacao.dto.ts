import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResponderAvaliacaoDto {
  @IsNotEmpty({ message: 'Informe a resposta.' }) @IsString() @MaxLength(2000) respostaDaUsina: string;
  @IsOptional() @IsString() usinaId?: string;
}
