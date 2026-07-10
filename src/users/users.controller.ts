import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwtAuth.guard";
import { User } from "./entities/user.entity";
import { CurrentUser } from "src/auth/decorators/currentUser.decorator";
import { UpdateProfileDto } from "./dto/updateProfile.dto";
import { UsersService } from "./users.service";

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    getProfile(@CurrentUser() user: User) {
        return user;
    }

    @Patch('me')
    updateProfile(@CurrentUser() user: User, @Body() updateUserDto: UpdateProfileDto) {
        return this.usersService.updateProfile(user.id, updateUserDto);
    }
}