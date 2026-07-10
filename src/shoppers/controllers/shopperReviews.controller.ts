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
import { ReviewsService } from 'src/reviews/reviews.service';
import { CreateReviewDto } from '../dto/createReview.dto';
import { UpdateReviewDto } from '../dto/updateReview.dto';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';

@ApiTags('shopper-reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SHOPPER)
@Controller('shoppers/me/reviews')
export class ShopperReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post()
    @ApiOperation({ summary: 'Review and rate a product from a placed order' })
    create(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
        return this.reviewsService.create(user.id, dto);
    }

    @Get()
    @ApiOperation({ summary: 'List my product reviews' })
    findAll(@CurrentUser() user: User, @Query() query: PaginationQueryDto) {
        return this.reviewsService.findMyReviews(user.id, query);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update my product review' })
    update(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateReviewDto,
    ) {
        return this.reviewsService.update(user.id, id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete my product review' })
    remove(
        @CurrentUser() user: User,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.reviewsService.remove(user.id, id);
    }
}
