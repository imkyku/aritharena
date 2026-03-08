import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rating, RatingSchema } from './schemas/rating.schema.js';
import { RatingsService } from './ratings.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Rating.name, schema: RatingSchema }])],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
