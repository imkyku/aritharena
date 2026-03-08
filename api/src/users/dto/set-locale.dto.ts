import { IsIn } from 'class-validator';

export class SetLocaleDto {
  @IsIn(['ru', 'en'])
  locale!: 'ru' | 'en';
}
