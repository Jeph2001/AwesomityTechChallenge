import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../enums/orderStatus.enum';

export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    status: OrderStatus;
}
