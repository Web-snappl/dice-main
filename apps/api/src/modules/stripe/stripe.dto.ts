import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class CreateStripeDepositIntentDto {
  @Type(() => Number)
  @IsInt()
  @Min(500)
  @Max(99_999_999)
  amount: number;
}
