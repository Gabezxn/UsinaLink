import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePagamentoDto {
  @IsNotEmpty({ message: 'Informe o pedido pago.' }) @IsString() pedidoId: string;
  @IsOptional() @IsString() propostaId?: string;
  @IsOptional() @IsString() metodo?: string;
  @IsOptional() @IsString() method?: string;
}
