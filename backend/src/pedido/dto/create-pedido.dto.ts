import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsAnexo } from '../../common/anexo';

export class CreatePedidoDto {
  @IsOptional() @IsString() empresaId?: string;
  @IsOptional() @IsString() empresa?: string;
  @IsNotEmpty({ message: 'Informe a peca do pedido.' }) @IsString() @MaxLength(200) peca: string;
  @IsOptional() @IsString() @MaxLength(200) categoria?: string;
  @IsOptional() @IsString() @MaxLength(200) material?: string;
  @IsOptional() @IsString() quantidade?: string;
  @IsOptional() @IsString() prazo?: string;
  @IsOptional() @IsString() prazoEntregaDias?: string;
  @IsOptional() @IsString() regiao?: string;
  @IsOptional() @IsString() urgencia?: string;
  @IsOptional() @IsString() @MaxLength(2000) descricao?: string;
  @IsOptional() @IsString() @IsAnexo() arquivo?: string;
}
