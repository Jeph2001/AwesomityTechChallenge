import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { PaymentMethod } from '../enums/paymentMethod.enum';
import { PaymentStatus } from '../enums/paymentStatus.enum';
import { MobileMoneyProvider } from '../enums/mobileMoneyProvider.enum';

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column({ type: 'uuid' })
    orderId: string;

    @Column({ type: 'enum', enum: PaymentMethod })
    method: PaymentMethod;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Column({ type: 'varchar' })
    currency: string;

    @Column({ type: 'varchar' })
    providerReference: string;

    @Column({ type: 'varchar', nullable: true })
    maskedAccount: string | null;

    @Column({
        type: 'enum',
        enum: MobileMoneyProvider,
        nullable: true,
    })
    mobileMoneyProvider: MobileMoneyProvider | null;

    @Column({ type: 'text', nullable: true })
    failureReason: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, unknown> | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
