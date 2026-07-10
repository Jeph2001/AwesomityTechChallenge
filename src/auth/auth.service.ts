import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import { EmailVerification } from "./entities/emailVerification.entity";
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from "@nestjs/config";
import { MailService } from "src/mail/mail.service";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Role } from "src/users/enums/role.enum";
import { LoginDto } from "./dto/login.dto";

const SALT_ROUNDS = 12

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(EmailVerification)
        private readonly verificationRepository: Repository<EmailVerification>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
    ) { }

    async register(dto: RegisterDto): Promise<{ message: string }> {
        const existing = await this.userRepository.findOne({ where: { email: dto.email } });
        if (existing) {
            throw new ConflictException('Email is already registered');
        }

        const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

        const user = this.userRepository.create({
            fullName: dto.fullName,
            email: dto.email,
            password: hashedPassword,
            role: Role.SHOPPER,
        });

        await this.userRepository.save(user);

        await this.issueEmailVerification(user);

        return { message: 'User registered successfully. Please check your email to verify your account.' };
    }

    private async issueEmailVerification(user: User): Promise<void> {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        await this.verificationRepository.save(
            this.verificationRepository.create({
                userId: user.id,
                token: hashedToken,
                expiresAt,
            })
        );
        const verifyUrl = `${this.configService.get<string>('app.baseUrl')}/auth/verify-email?token=${rawToken}`;

        await this.mailService.sendMail({
            to: user.email,
            subject: 'Verify your email',
            text: `Please verify your email by clicking the following link: ${verifyUrl}`,
            html: `<p>Hi ${user.fullName},</p><p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>. It expires in 24 hours.</p>`
        })
    }

    async verifyEmail(token: string): Promise<{ message: string }> {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const record = await this.verificationRepository.findOne({ where: { token: hashedToken } });
        if (!record) {
            throw new ConflictException('Invalid or expired verification token');
        }

        if (record.expiresAt < new Date()) {
            await this.verificationRepository.delete({ id: record.id });
            throw new ConflictException('Verification token has expired');
        }

        await this.userRepository.update({ id: record.userId }, { isEmailVerified: true });
        await this.verificationRepository.delete({ id: record.id });

        return { message: 'Email verified successfully' };
    }

    async login(dto: LoginDto) {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email: dto.email })
            .getOne();

        if (!user || !(await bcrypt.compare(dto.password, user.password))) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!user.isEmailVerified) {
            throw new UnauthorizedException('Email not verified. Please check your email for verification instructions.');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is inactive. Please contact support.');
        }

        return this.issueTokens(user);
    }

    private async issueTokens(user: User) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('jwt.accessTokenSecret'),
            expiresIn: this.configService.get<string>('jwt.accessTokenExpiresIn') as any,
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('jwt.refreshTokenSecret'),
            expiresIn: this.configService.get<string>('jwt.refreshTokenExpiresIn') as any,
        });

        const refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);

        await this.userRepository.update({ id: user.id }, { refreshToken: refreshTokenHash });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            }
        };
    }

    async refresh(refreshToken: string) {
        let payload: { sub: string };
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('jwt.refreshTokenSecret'),
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.refreshToken')
            .where('user.id = :id', { id: payload.sub })
            .getOne();

        if (!user?.refreshToken || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        return this.issueTokens(user);
    }

    async logout(userId: string): Promise<void> {
        await this.userRepository.update(userId, { refreshToken: null });
    }
}