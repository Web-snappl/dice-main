import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtUserGuard } from '../auth/guards/jwt-user.guard';
import { CreateStripeDepositIntentDto } from './stripe.dto';
import { StripeService } from './stripe.service';

@Controller('stripe')
@UseGuards(JwtUserGuard)
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('deposit-intent')
  createDepositIntent(@Req() req, @Body() body: CreateStripeDepositIntentDto) {
    return this.stripeService.createDepositIntent(req.user.userId, body.amount);
  }

  @Get('deposit-status/:referenceId')
  getDepositStatus(@Req() req, @Param('referenceId') referenceId: string) {
    return this.stripeService.getDepositStatus(req.user.userId, referenceId);
  }
}
