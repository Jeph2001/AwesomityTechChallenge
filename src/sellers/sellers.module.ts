import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerApplication } from './entities/sellerApplication.entity';
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';
import { SellerProductsController } from './controllers/sellerProducts.controller';
import { SellerOrdersController } from './controllers/sellerOrders.controller';
import { User } from 'src/users/entities/user.entity';
import { Store } from 'src/stores/entities/store.entity';
import { StoresModule } from 'src/stores/stores.module';
import { ProductsModule } from 'src/products/products.module';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([SellerApplication, User, Store]),
        StoresModule,
        ProductsModule,
        OrdersModule,
    ],
    controllers: [
        SellersController,
        SellerProductsController,
        SellerOrdersController,
    ],
    providers: [SellersService],
    exports: [SellersService, TypeOrmModule],
})
export class SellersModule { }
