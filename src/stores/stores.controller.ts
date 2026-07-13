import {
    Body,
    Controller,
    Get,
    NotFoundException,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/currentUser.decorator';
import { Role } from 'src/users/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/createStore.dto';
import { UpdateStoreDto } from './dto/updateStore.dto';

@ApiTags('stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
@Controller('stores/me')
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    @Get()
    @ApiOperation({ summary: 'Get the authenticated seller store' })
    async getMyStore(@CurrentUser() user: User) {
        const store = await this.storesService.findByOwnerId(user.id);
        if (!store) {
            throw new NotFoundException('You do not have a store yet. Create one first.');
        }
        return store;
    }

    @Post()
    @ApiOperation({ summary: 'Create the seller store (only one allowed)' })
    createMyStore(@CurrentUser() user: User, @Body() dto: CreateStoreDto) {
        return this.storesService.create(user.id, dto);
    }

    @Patch()
    @ApiOperation({ summary: 'Update the seller store' })
    updateMyStore(@CurrentUser() user: User, @Body() dto: UpdateStoreDto) {
        return this.storesService.updateOwnedStore(user.id, dto);
    }
}
