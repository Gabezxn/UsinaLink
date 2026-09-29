import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

const paraTexto = ({ value }: { value: unknown }) => (value === undefined || value === null ? value : String(value));

export class CreatePagamentoDto {
  @Transform(paraTexto) @IsNotEmpty({ message: 'Informe o pedido pago.' }) @IsString() pedidoId: string;
  @Transform(paraTexto) @IsOptional() @IsString() propostaId?: string;
  @IsOptional() @IsString() metodo?: string;
  @IsOptional() @IsString() method?: string;
}
