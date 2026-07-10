import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { BrowseProductsQueryDto } from './dto/browseProductsQuery.dto';
import { ReviewsService } from 'src/reviews/reviews.service';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';

@ApiTags('catalog-products')
@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly reviewsService: ReviewsService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Browse products by category and search' })
    browse(@Query() query: BrowseProductsQueryDto) {
        return this.productsService.findAll(
            query,
            false,
            undefined,
            query.categoryId,
            true,
        );
    }

    @Get('featured')
    @ApiOperation({ summary: 'Browse featured products' })
    featured(@Query() query: BrowseProductsQueryDto) {
        return this.productsService.findAll(
            query,
            true,
            undefined,
            query.categoryId,
            true,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a product by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.findOnePublic(id);
    }

    @Get(':id/reviews')
    @ApiOperation({ summary: 'List reviews for a product' })
    findReviews(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() query: PaginationQueryDto,
    ) {
        return this.reviewsService.findByProduct(id, query);
    }
}
