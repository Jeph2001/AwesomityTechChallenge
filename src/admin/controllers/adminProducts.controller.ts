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
import { Role } from 'src/users/enums/role.enum';
import { ProductsService } from 'src/products/products.service';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';
import { CreateProductDto } from 'src/products/dto/createProduct.dto';
import { UpdateProductDto } from 'src/products/dto/updateProduct.dto';
import { SetFeaturedDto } from 'src/products/dto/setFeatured.dto';

@ApiTags('admin-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/products')
export class AdminProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @ApiOperation({ summary: 'List all products' })
    findAll(@Query() query: PaginationQueryDto) {
        return this.productsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a product by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a product' })
    create(@Body() dto: CreateProductDto) {
        return this.productsService.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a product' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateProductDto,
    ) {
        return this.productsService.update(id, dto);
    }

    @Patch(':id/featured')
    @ApiOperation({ summary: 'Mark or unmark a product as featured' })
    setFeatured(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SetFeaturedDto,
    ) {
        return this.productsService.setFeatured(id, dto.isFeatured);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a product' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.remove(id);
    }
}
