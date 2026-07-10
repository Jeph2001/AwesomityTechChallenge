import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { StoresModule } from 'src/stores/stores.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { ReviewsModule } from 'src/reviews/reviews.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product]),
        StoresModule,
        CategoriesModule,
        ReviewsModule,
    ],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule { }
