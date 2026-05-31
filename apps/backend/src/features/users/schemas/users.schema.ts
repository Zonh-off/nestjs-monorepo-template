import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { UserSchema } from '@nestjs-monorepo-template/common';

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  image: z.string().url().optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) { }
export class UserDto extends createZodDto(UserSchema) { }
