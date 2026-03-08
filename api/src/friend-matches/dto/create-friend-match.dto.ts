import { IsInt, Max, Min } from 'class-validator';

export class CreateFriendMatchDto {
  @IsInt()
  @Min(1)
  @Max(3)
  bestOf = 1;
}
