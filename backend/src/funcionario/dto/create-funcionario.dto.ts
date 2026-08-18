import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFuncionarioDto {
  @IsOptional() @IsString() contexto?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsNotEmpty() @IsString() nome: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() cargo?: string;
  @IsOptional() @IsString() tipo?: string;
  @IsOptional() @IsString() conviteToken?: string;
}
