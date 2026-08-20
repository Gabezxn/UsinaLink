import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePedidoDto {
  @IsOptional() @IsString() empresaId?: string;
  @IsOptional() @IsString() empresa?: string;
  @IsNotEmpty({ message: 'Informe a peca do pedido.' }) @IsString() peca: string;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsString() quantidade?: string;
  @IsOptional() @IsString() prazo?: string;
  @IsOptional() @IsString() prazoEntregaDias?: string;
  @IsOptional() @IsString() regiao?: string;
  @IsOptional() @IsString() urgencia?: string;
  @IsOptional() @IsString() descricao?: string;
  @IsOptional() @IsString() arquivo?: string;
}
