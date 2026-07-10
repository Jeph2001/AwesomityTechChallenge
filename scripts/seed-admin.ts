import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/users/entities/user.entity';
import { Role } from '../src/users/enums/role.enum';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(User);

    const email = process.env.ADMIN_EMAIL ?? 'admin@awesomity.com';
    const password = process.env.ADMIN_PASSWORD ?? 'Admin123!';
    const fullName = process.env.ADMIN_FULL_NAME ?? 'Platform Admin';

    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
        existing.role = Role.ADMIN;
        existing.isEmailVerified = true;
        existing.isActive = true;
        await userRepo.save(existing);
        console.log(`Admin already exists and was ensured: ${email}`);
    } else {
        const hashedPassword = await bcrypt.hash(password, 12);
        await userRepo.save(
            userRepo.create({
                fullName,
                email,
                password: hashedPassword,
                role: Role.ADMIN,
                isEmailVerified: true,
                isActive: true,
            }),
        );
        console.log(`Admin created: ${email} / ${password}`);
    }

    await app.close();
}

seed().catch((error) => {
    console.error('Admin seed failed', error);
    process.exit(1);
});
