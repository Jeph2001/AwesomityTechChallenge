import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
    @IsUUID()
    productId: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    @MinLength(2)
    comment?: string;
}
