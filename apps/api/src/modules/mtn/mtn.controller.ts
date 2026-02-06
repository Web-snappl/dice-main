import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { MtnService } from './mtn.service';
// Assuming you have an AuthGuard, importing generic for now or standard
// import { AuthGuard } from '../auth/auth.guard'; 

@Controller('mtn')
export class MtnController {
    constructor(private readonly mtnService: MtnService) { }

    @Post('deposit')
    async deposit(@Body() body: { phone: string; amount: number }) {
        return this.mtnService.requestDeposit(body.phone, body.amount);
    }

    @Post('withdraw')
    async withdraw(@Body() body: { phone: string; amount: number }) {
        return this.mtnService.requestWithdrawal(body.phone, body.amount);
    }
}
