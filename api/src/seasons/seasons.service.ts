import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Season } from './schemas/season.schema.js';

@Injectable()
export class SeasonsService {
  constructor(@InjectModel(Season.name) private readonly seasonModel: Model<Season>) {}

  async getActiveSeason() {
    return this.seasonModel.findOne({ active: true }).sort({ startsAt: -1 }).lean().exec();
  }
}
