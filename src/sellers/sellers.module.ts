import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellerApplication } from './entities/sellerApplication.entity';
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';
import { User } from 'src/users/entities/user.entity';
import { Store } from 'src/stores/entities/store.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SellerApplication, User, Store])],
    controllers: [SellersController],
    providers: [SellersService],
    exports: [SellersService, TypeOrmModule],
})
export class SellersModule { }
