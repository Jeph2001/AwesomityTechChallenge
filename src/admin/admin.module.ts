import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { SellersModule } from 'src/sellers/sellers.module';
import { StoresModule } from 'src/stores/stores.module';
import { ProductsModule } from 'src/products/products.module';
import { OrdersModule } from 'src/orders/orders.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { AdminUsersController } from './controllers/adminUsers.controller';
import { AdminSellersController } from './controllers/adminSellers.controller';
import { AdminStoresController } from './controllers/adminStores.controller';
import { AdminProductsController } from './controllers/adminProducts.controller';
import { AdminOrdersController } from './controllers/adminOrders.controller';
import { AdminCategoriesController } from './controllers/adminCategories.controller';

@Module({
    imports: [
        UsersModule,
        SellersModule,
        StoresModule,
        ProductsModule,
        OrdersModule,
        CategoriesModule,
    ],
    controllers: [
        AdminUsersController,
        AdminSellersController,
        AdminStoresController,
        AdminProductsController,
        AdminOrdersController,
        AdminCategoriesController,
    ],
})
export class AdminModule { }
