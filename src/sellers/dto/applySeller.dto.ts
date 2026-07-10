import { IsOptional, IsString, MinLength } from 'class-validator';

export class ApplySellerDto {
    @IsString()
    @MinLength(3)
    fullName: string;

    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsString()
    @MinLength(2)
    businessName: string;

    @IsOptional()
    @IsString()
    description?: string;
}
