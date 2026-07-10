import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { SellerApplicationStatus } from '../enums/sellerApplicationStatus.enum';

@Entity('seller_applications')
export class SellerApplication {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    fullName: string;

    @Index({ unique: true })
    @Column()
    email: string;

    @Column({ type: 'varchar', nullable: true })
    phone: string | null;

    @Column()
    businessName: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({
        type: 'enum',
        enum: SellerApplicationStatus,
        default: SellerApplicationStatus.PENDING,
    })
    status: SellerApplicationStatus;

    @Column({ type: 'varchar', select: false, nullable: true })
    inviteToken: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    inviteExpiresAt: Date | null;

    @Column({ type: 'text', nullable: true })
    rejectionReason: string | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reviewedById' })
    reviewedBy: User | null;

    @Column({ type: 'uuid', nullable: true })
    reviewedById: string | null;

    @Column({ type: 'timestamptz', nullable: true })
    reviewedAt: Date | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'userId' })
    user: User | null;

    @Column({ type: 'uuid', nullable: true })
    userId: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
