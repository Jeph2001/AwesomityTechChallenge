import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { StoresModule } from 'src/stores/stores.module';
import { CategoriesModule } from 'src/categories/categories.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product]),
        StoresModule,
        CategoriesModule,
    ],
    providers: [ProductsService],
    exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule { }
