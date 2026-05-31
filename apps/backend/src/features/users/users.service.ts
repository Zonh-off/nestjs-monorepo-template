import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@nestjs-monorepo-template/prisma';
import { UpdateUserDto } from './schemas/users.schema';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: { id: true, name: true, email: true, emailVerified: true, image: true, createdAt: true },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
