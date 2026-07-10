import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReview } from './entities/productReview.entity';
import { ReviewsService } from './reviews.service';
import { Order } from 'src/orders/entities/order.entity';
import { Product } from 'src/products/entities/product.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ProductReview, Order, Product])],
    providers: [ReviewsService],
    exports: [ReviewsService, TypeOrmModule],
})
export class ReviewsModule { }
