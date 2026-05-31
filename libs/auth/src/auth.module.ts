import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@nestjs-monorepo-template/prisma';
import { BetterAuthService } from './auth.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [BetterAuthService],
  exports: [BetterAuthService],
})
export class BetterAuthModule {}
