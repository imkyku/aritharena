import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Season, SeasonSchema } from './schemas/season.schema.js';
import { SeasonsService } from './seasons.service.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Season.name, schema: SeasonSchema }])],
  providers: [SeasonsService],
  exports: [SeasonsService],
})
export class SeasonsModule {}
