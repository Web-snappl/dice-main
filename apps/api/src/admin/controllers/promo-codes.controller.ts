import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PromoCodesService } from '../services/promo-codes.service';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';

@Controller('admin/promo-codes')
@UseGuards(JwtAdminGuard)
export class PromoCodesController {
    constructor(private readonly promoCodesService: PromoCodesService) { }

    @Get()
    async getAll() {
        return this.promoCodesService.getAll();
    }

    @Post()
    async create(@Body() body: { code: string; bonusAmount: number; maxUses?: number; expiresAt?: Date }) {
        return this.promoCodesService.create(body);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.promoCodesService.delete(id);
        return { message: 'Promo code deleted' };
    }
}
