import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Store } from 'src/stores/entities/store.entity';
import { OrderStatus } from '../enums/orderStatus.enum';
import { OrderItem } from './orderItem.entity';
import { Payment } from 'src/payments/entities/payment.entity';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => Store, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'storeId' })
    store: Store | null;

    @Column({ type: 'uuid', nullable: true })
    storeId: string | null;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    totalAmount: number;

    @Column({ type: 'text' })
    shippingAddress: string;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @OneToMany(() => Payment, (payment) => payment.order)
    payments: Payment[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
