import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

const paraTexto = ({ value }: { value: unknown }) => (value === undefined || value === null ? value : String(value));

export class CreatePagamentoDto {
  @Transform(paraTexto) @IsNotEmpty({ message: 'Informe o pedido pago.' }) @IsString() pedidoId: string;
  @Transform(paraTexto) @IsOptional() @IsString() propostaId?: string;
  @IsOptional() @IsString() metodo?: string;
  @IsOptional() @IsString() method?: string;
}

export class CheckoutDto {
  @Transform(paraTexto) @IsNotEmpty({ message: 'Informe o pedido a pagar.' }) @IsString() pedidoId: string;
  @IsOptional() @IsString() retorno?: string;
}

export class ConfirmarCheckoutDto {
  @IsNotEmpty({ message: 'Informe a sessao de pagamento.' }) @IsString() sessionId: string;
}
