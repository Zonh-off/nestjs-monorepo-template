import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { AppController } from './app.controller';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';
import { AssetsModule } from './features/assets/assets.module';
import { PrismaModule } from '@nestjs-monorepo-template/prisma';
import { QueueModule } from '@nestjs-monorepo-template/queue';
import { CacheModule } from '@nestjs-monorepo-template/cache';
import { StorageModule } from '@nestjs-monorepo-template/storage';
import { BetterAuthModule } from '@nestjs-monorepo-template/auth';

@Module({
  imports: [
    PrismaModule,
    BetterAuthModule,
    CoreModule,
    AuthModule,
    UsersModule,
    AssetsModule,
    QueueModule,
    CacheModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
