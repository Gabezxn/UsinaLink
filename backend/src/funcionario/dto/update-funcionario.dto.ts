import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateFuncionarioDto {
  @IsOptional() @IsString() nome?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() cargo?: string;
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsString() status?: string;
}
