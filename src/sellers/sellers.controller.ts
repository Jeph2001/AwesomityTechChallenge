import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SellersService } from './sellers.service';
import { ApplySellerDto } from './dto/applySeller.dto';
import { CompleteSellerRegistrationDto } from './dto/completeSellerRegistration.dto';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
    constructor(private readonly sellersService: SellersService) { }

    @Post('apply')
    @ApiOperation({ summary: 'Apply to become a seller by sending your email' })
    apply(@Body() dto: ApplySellerDto) {
        return this.sellersService.apply(dto);
    }

    @Post('complete-registration')
    @ApiOperation({ summary: 'Create seller account and shop using approval invite token' })
    completeRegistration(@Body() dto: CompleteSellerRegistrationDto) {
        return this.sellersService.completeRegistration(dto);
    }
}
