import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class ApplySellerDto {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    @MinLength(3)
    fullName?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    businessName?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
