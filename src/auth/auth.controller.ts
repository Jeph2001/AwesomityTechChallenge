import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { VerifyEmailDto } from "./dto/verifyEmail.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refreshToken.dto";
import { JwtAuthGuard } from "./guards/jwtAuth.guard";
import { CurrentUser } from "./decorators/currentUser.decorator";
import { User } from "src/users/entities/user.entity";

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new shopper account' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto)
    }

    @Get('verify-email')
    @ApiOperation({ summary: 'Verify email address using token from the verification email' })
    async verifyEmail(@Query() query: VerifyEmailDto) {
        return this.authService.verifyEmail(query.token);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('refresh-token')
    @ApiOperation({ summary: 'Refresh access token using refresh token' })
    refreshToken(@Body() refreshToken: RefreshTokenDto) {
        return this.authService.refresh(refreshToken.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout and invalidate the refresh token' })
    logout(@CurrentUser() user: User) {
        return this.authService.logout(user.id);
    }
}