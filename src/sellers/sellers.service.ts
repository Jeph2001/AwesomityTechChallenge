import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/users/enums/role.enum';
import { Store } from 'src/stores/entities/store.entity';
import { uniqueSlug } from 'src/common/utils/slug.util';
import { SellerApplication } from './entities/sellerApplication.entity';
import { SellerApplicationStatus } from './enums/sellerApplicationStatus.enum';
import { ApplySellerDto } from './dto/applySeller.dto';
import { CompleteSellerRegistrationDto } from './dto/completeSellerRegistration.dto';
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class SellersService {
    constructor(
        @InjectRepository(SellerApplication)
        private readonly applicationRepo: Repository<SellerApplication>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Store)
        private readonly storeRepo: Repository<Store>,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
    ) { }

    async apply(dto: ApplySellerDto): Promise<{ message: string }> {
        const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
        if (existingUser) {
            throw new ConflictException('An account with this email already exists');
        }

        const existingApplication = await this.applicationRepo.findOne({
            where: { email: dto.email },
        });

        if (existingApplication) {
            if (existingApplication.status === SellerApplicationStatus.PENDING) {
                throw new ConflictException('A pending application already exists for this email');
            }
            if (existingApplication.status === SellerApplicationStatus.APPROVED && !existingApplication.userId) {
                throw new ConflictException('This application was already approved. Check your email to complete registration.');
            }
            if (existingApplication.status === SellerApplicationStatus.APPROVED) {
                throw new ConflictException('This email is already associated with an approved seller');
            }

            existingApplication.fullName = dto.fullName;
            existingApplication.phone = dto.phone ?? null;
            existingApplication.businessName = dto.businessName;
            existingApplication.description = dto.description ?? null;
            existingApplication.status = SellerApplicationStatus.PENDING;
            existingApplication.rejectionReason = null;
            existingApplication.reviewedAt = null;
            existingApplication.reviewedById = null;
            existingApplication.inviteToken = null;
            existingApplication.inviteExpiresAt = null;
            await this.applicationRepo.save(existingApplication);

            return { message: 'Seller application resubmitted successfully. Awaiting admin approval.' };
        }

        const application = this.applicationRepo.create({
            fullName: dto.fullName,
            email: dto.email,
            phone: dto.phone ?? null,
            businessName: dto.businessName,
            description: dto.description ?? null,
            status: SellerApplicationStatus.PENDING,
        });

        await this.applicationRepo.save(application);

        return { message: 'Seller application submitted successfully. Awaiting admin approval.' };
    }

    async findApplications(query: PaginationQueryDto, status?: SellerApplicationStatus) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const qb = this.applicationRepo
            .createQueryBuilder('application')
            .leftJoinAndSelect('application.reviewedBy', 'reviewedBy')
            .orderBy('application.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (status) {
            qb.andWhere('application.status = :status', { status });
        }

        if (query.search) {
            qb.andWhere(
                '(application.fullName ILIKE :search OR application.email ILIKE :search OR application.businessName ILIKE :search)',
                { search: `%${query.search}%` },
            );
        }

        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }

    async findApplicationById(id: string): Promise<SellerApplication> {
        const application = await this.applicationRepo.findOne({
            where: { id },
            relations: { reviewedBy: true, user: true },
        });
        if (!application) {
            throw new NotFoundException('Seller application not found');
        }
        return application;
    }

    async approve(
        id: string,
        adminId: string,
    ): Promise<{ message: string; inviteToken?: string }> {
        const application = await this.findApplicationById(id);

        if (application.status === SellerApplicationStatus.APPROVED && application.userId) {
            throw new ConflictException('Seller application is already approved and registered');
        }

        if (application.status === SellerApplicationStatus.APPROVED && !application.userId) {
            return this.issueInvite(application, 'Approval invite email resent successfully');
        }

        if (application.status !== SellerApplicationStatus.PENDING) {
            throw new ConflictException('Only pending applications can be approved');
        }

        const existingUser = await this.userRepo.findOne({ where: { email: application.email } });
        if (existingUser) {
            throw new ConflictException('A user with this email already exists');
        }

        application.status = SellerApplicationStatus.APPROVED;
        application.reviewedById = adminId;
        application.reviewedAt = new Date();
        application.rejectionReason = null;
        await this.applicationRepo.save(application);

        return this.issueInvite(
            application,
            'Seller application approved. Invite email sent.',
        );
    }

    private async issueInvite(
        application: SellerApplication,
        successMessage: string,
    ): Promise<{ message: string; inviteToken?: string }> {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        application.inviteToken = hashedToken;
        application.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.applicationRepo.save(application);

        let emailSent = true;
        try {
            await this.sendInviteEmail(application, rawToken);
        } catch (error) {
            emailSent = false;
            console.error('Failed to send seller approval email', error);
        }

        return {
            message: emailSent
                ? successMessage
                : `${successMessage.replace(/\.\s*$/, '')}, but invite email failed to send. Use the invite token below.`,
            inviteToken: emailSent ? undefined : rawToken,
        };
    }

    async reject(id: string, adminId: string, reason?: string): Promise<{ message: string }> {
        const application = await this.findApplicationById(id);

        if (application.status !== SellerApplicationStatus.PENDING) {
            throw new ConflictException('Only pending applications can be rejected');
        }

        application.status = SellerApplicationStatus.REJECTED;
        application.rejectionReason = reason ?? null;
        application.reviewedById = adminId;
        application.reviewedAt = new Date();
        application.inviteToken = null;
        application.inviteExpiresAt = null;

        await this.applicationRepo.save(application);

        try {
            await this.mailService.sendMail({
                to: application.email,
                subject: 'Seller application update',
                text: `Hi ${application.fullName}, your seller application for "${application.businessName}" was not approved.${reason ? ` Reason: ${reason}` : ''}`,
                html: `<p>Hi ${application.fullName},</p><p>Your seller application for <strong>${application.businessName}</strong> was not approved.</p>${reason ? `<p>Reason: ${reason}</p>` : ''}`,
            });
        } catch (error) {
            console.error('Failed to send seller rejection email', error);
        }

        return { message: 'Seller application rejected' };
    }

    async completeRegistration(dto: CompleteSellerRegistrationDto): Promise<{ message: string }> {
        const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');

        const application = await this.applicationRepo
            .createQueryBuilder('application')
            .addSelect('application.inviteToken')
            .where('application.inviteToken = :token', { token: hashedToken })
            .getOne();

        if (!application) {
            throw new ConflictException('Invalid or expired invite token');
        }

        if (application.status !== SellerApplicationStatus.APPROVED) {
            throw new ConflictException('Seller application is not approved');
        }

        if (application.userId) {
            throw new ConflictException('Seller account has already been created');
        }

        if (!application.inviteExpiresAt || application.inviteExpiresAt < new Date()) {
            throw new ConflictException('Invite token has expired. Please contact support.');
        }

        const existingUser = await this.userRepo.findOne({ where: { email: application.email } });
        if (existingUser) {
            throw new ConflictException('An account with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

        const user = await this.userRepo.save(
            this.userRepo.create({
                fullName: application.fullName,
                email: application.email,
                password: hashedPassword,
                role: Role.SELLER,
                isEmailVerified: true,
                isActive: true,
            }),
        );

        await this.storeRepo.save(
            this.storeRepo.create({
                name: dto.storeName,
                slug: uniqueSlug(dto.storeName),
                description: dto.storeDescription ?? application.description,
                ownerId: user.id,
                isActive: true,
            }),
        );

        application.userId = user.id;
        application.inviteToken = null;
        application.inviteExpiresAt = null;
        await this.applicationRepo.save(application);

        return {
            message: 'Seller account and shop created successfully. You can now log in.',
        };
    }

    private async sendInviteEmail(application: SellerApplication, rawToken: string): Promise<void> {
        const baseUrl = this.configService.get<string>('app.baseUrl');
        const registerUrl = `${baseUrl}/api/sellers/complete-registration?token=${rawToken}`;

        await this.mailService.sendMail({
            to: application.email,
            subject: 'Your seller application was approved',
            text: `Hi ${application.fullName}, your seller application was approved. Create your account and shop using this link: ${registerUrl}. The link expires in 7 days. Token: ${rawToken}`,
            html: `<p>Hi ${application.fullName},</p>
<p>Your seller application for <strong>${application.businessName}</strong> has been approved.</p>
<p>Use the token below with <code>POST /api/sellers/complete-registration</code> to create your account and shop.</p>
<p><strong>Token:</strong> ${rawToken}</p>
<p>Or open: <a href="${registerUrl}">${registerUrl}</a></p>
<p>This invite expires in 7 days.</p>`,
        });
    }
}
