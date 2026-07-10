import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
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
import { SellersService } from 'src/sellers/sellers.service';
import { SellerApplicationsQueryDto } from 'src/sellers/dto/sellerApplicationsQuery.dto';
import { RejectSellerApplicationDto } from 'src/sellers/dto/rejectSellerApplication.dto';

@ApiTags('admin-sellers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/sellers')
export class AdminSellersController {
    constructor(private readonly sellersService: SellersService) { }

    @Get('applications')
    @ApiOperation({ summary: 'List seller applications' })
    findApplications(@Query() query: SellerApplicationsQueryDto) {
        return this.sellersService.findApplications(query, query.status);
    }

    @Get('applications/:id')
    @ApiOperation({ summary: 'Get a seller application by id' })
    findApplication(@Param('id', ParseUUIDPipe) id: string) {
        return this.sellersService.findApplicationById(id);
    }

    @Post('applications/:id/approve')
    @ApiOperation({ summary: 'Approve a seller application and send invite email' })
    approve(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() admin: User,
    ) {
        return this.sellersService.approve(id, admin.id);
    }

    @Post('applications/:id/reject')
    @ApiOperation({ summary: 'Reject a seller application' })
    reject(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() admin: User,
        @Body() dto: RejectSellerApplicationDto,
    ) {
        return this.sellersService.reject(id, admin.id, dto.reason);
    }
}
