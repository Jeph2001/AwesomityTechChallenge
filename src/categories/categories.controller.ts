import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';

@ApiTags('catalog-categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    @ApiOperation({ summary: 'List active categories' })
    findAll(@Query() query: PaginationQueryDto) {
        return this.categoriesService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a category by id' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.categoriesService.findOne(id);
    }
}
