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
import { Product } from 'src/products/entities/product.entity';
import { Order } from 'src/orders/entities/order.entity';

@Entity('product_reviews')
@Index(['userId', 'productId'], { unique: true })
export class ProductReview {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({ type: 'uuid' })
    productId: string;

    @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'orderId' })
    order: Order | null;

    @Column({ type: 'uuid', nullable: true })
    orderId: string | null;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
