import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { User, UserSchema } from './schemas/user.schema.js';
import { RatingsModule } from '../ratings/ratings.module.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), RatingsModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
