import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { OrdersService } from './orders.service';
import { Product } from 'src/products/entities/product.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, Product])],
    providers: [OrdersService],
    exports: [OrdersService, TypeOrmModule],
})
export class OrdersModule { }
