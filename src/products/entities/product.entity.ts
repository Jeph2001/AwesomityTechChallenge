import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Store } from 'src/stores/entities/store.entity';
import { Category } from 'src/categories/entities/category.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    price: number;

    @Column({ type: 'int', default: 0 })
    stock: number;

    @Column({ type: 'varchar', nullable: true })
    imageUrl: string | null;

    @Column({ default: false })
    isFeatured: boolean;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Store, (store) => store.products, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'storeId' })
    store: Store;

    @Column({ type: 'uuid' })
    storeId: string;

    @ManyToOne(() => Category, (category) => category.products, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'categoryId' })
    category: Category | null;

    @Column({ type: 'uuid', nullable: true })
    categoryId: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
