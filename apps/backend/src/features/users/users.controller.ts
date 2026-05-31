import { Controller, Get, Patch, Body, Param, Res, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { UsersService } from './users.service';
import { UpdateUserDto } from './schemas/users.schema';
import { Public } from '../../core/decorators/public.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { AuthUser } from '@nestjs-monorepo-template/auth';
import { MailQueueService, AssetQueueService } from '@nestjs-monorepo-template/queue';
import { CacheService } from '@nestjs-monorepo-template/cache';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private mailQueueService: MailQueueService,
    private assetQueueService: AssetQueueService,
    private cacheService: CacheService
  ) { }

  @Public()
  @Get()
  async getAllUsers(@Res({ passthrough: true }) res: Response) {
    const { users, total } = await this.usersService.findAll();
    res.header('x-total-count', total.toString());
    return users;
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getUserById(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() data: UpdateUserDto) {
    return this.usersService.updateUser(user.id, data);
  }

  @Public()
  @UseInterceptors(CacheInterceptor)
  @Get(':id')
  getUserProfile(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Public()
  @Get('cached/:id')
  getCachedUserProfile(@Param('id') id: string) {
    return this.cacheService.wrap(`users:profile:${id}`, () => {
      return this.usersService.getUserById(id);
    }, 60 * 1000);
  }
}
