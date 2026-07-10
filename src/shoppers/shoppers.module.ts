import { Module } from '@nestjs/common';
import { OrdersModule } from 'src/orders/orders.module';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { ShopperOrdersController } from './controllers/shopperOrders.controller';
import { ShopperReviewsController } from './controllers/shopperReviews.controller';

@Module({
    imports: [OrdersModule, ReviewsModule],
    controllers: [ShopperOrdersController, ShopperReviewsController],
})
export class ShoppersModule { }
