import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { Role } from 'src/users/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
import { StoresService } from 'src/stores/stores.service';
import { ProductsService } from 'src/products/products.service';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';
import { SellerCreateProductDto } from '../dto/sellerCreateProduct.dto';
import { SellerUpdateProductDto } from '../dto/sellerUpdateProduct.dto';

@ApiTags('seller-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
@Controller('sellers/me/products')
export class SellerProductsController {
    constructor(
        private readonly storesService: StoresService,
        private readonly productsService: ProductsService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'List products in the seller store' })
    async findAll(@CurrentUser() user: User, @Query() query: PaginationQueryDto) {
        const store = await this.storesService.getOwnedStore(user.id);
        return this.productsService.findAll(query, false, store.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a product from the seller store' })
    async findOne(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const store = await this.storesService.getOwnedStore(user.id);
        return this.productsService.findOneInStore(id, store.id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a product in the seller store' })
    async create(@CurrentUser() user: User, @Body() dto: SellerCreateProductDto) {
        const store = await this.storesService.getOwnedStore(user.id);
        return this.productsService.createForStore(store.id, dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a product in the seller store' })
    async update(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SellerUpdateProductDto,
    ) {
        const store = await this.storesService.getOwnedStore(user.id);
        return this.productsService.updateInStore(id, store.id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a product from the seller store' })
    async remove(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const store = await this.storesService.getOwnedStore(user.id);
        return this.productsService.removeInStore(id, store.id);
    }
}
