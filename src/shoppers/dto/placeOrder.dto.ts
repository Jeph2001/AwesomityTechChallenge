import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsString,
    IsUUID,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';

export class PlaceOrderItemDto {
    @IsUUID()
    productId: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;
}

export class PlaceOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => PlaceOrderItemDto)
    items: PlaceOrderItemDto[];

    @IsString()
    @MinLength(5)
    shippingAddress: string;
}
