import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateAvaliacaoDto {
  @IsOptional() @IsInt() @Min(1) @Max(5) notaGeral?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) qualidade?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) prazo?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) comunicacao?: number;
  @IsOptional() @IsString() comentario?: string;
  @IsOptional() @IsString() empresaId?: string;
}
