import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PromoCode } from '../schemas/promo-code.schema';

@Injectable()
export class PromoCodesService implements OnModuleInit {
    constructor(
        @InjectModel(PromoCode.name) private readonly promoCodeModel: Model<PromoCode>,
    ) { }

    async onModuleInit() {
        await this.seedDefaultCodes();
    }

    private async seedDefaultCodes() {
        const exists = await this.promoCodeModel.findOne({ code: 'WELCOME200' }).exec();
        if (!exists) {
            await this.promoCodeModel.create({
                code: 'WELCOME200',
                bonusAmount: 200,
                maxUses: 0, // unlimited
                currentUses: 0,
                isActive: true,
            });
            console.log('🎟️  Seeded promo code: WELCOME200 (200 CFA bonus)');
        }
    }

    async getAll(): Promise<PromoCode[]> {
        return this.promoCodeModel.find().sort({ createdAt: -1 }).exec();
    }

    async create(data: { code: string; bonusAmount: number; maxUses?: number; expiresAt?: Date }): Promise<PromoCode> {
        const existing = await this.promoCodeModel.findOne({ code: data.code.toUpperCase() }).exec();
        if (existing) {
            throw new BadRequestException('Promo code already exists');
        }

        return this.promoCodeModel.create({
            code: data.code.toUpperCase(),
            bonusAmount: data.bonusAmount,
            maxUses: data.maxUses || 0,
            currentUses: 0,
            isActive: true,
            expiresAt: data.expiresAt,
        });
    }

    async delete(id: string): Promise<void> {
        const result = await this.promoCodeModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new BadRequestException('Promo code not found');
        }
    }

    /**
     * Validates a promo code WITHOUT incrementing usage.
     * Returns { valid, bonusAmount, reason? }.
     */
    async validate(code: string): Promise<{ valid: boolean; bonusAmount?: number; reason?: string }> {
        const promo = await this.promoCodeModel.findOne({ code: code.toUpperCase() }).exec();

        if (!promo) {
            return { valid: false, reason: 'Invalid promo code' };
        }
        if (!promo.isActive) {
            return { valid: false, reason: 'Promo code is no longer active' };
        }
        if (promo.expiresAt && new Date() > promo.expiresAt) {
            return { valid: false, reason: 'Promo code has expired' };
        }
        if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
            return { valid: false, reason: 'Promo code usage limit reached' };
        }

        return { valid: true, bonusAmount: promo.bonusAmount };
    }

    /**
     * Validates a promo code and increments its usage.
     * Returns the bonus amount if valid, throws otherwise.
     */
    async validateAndUse(code: string): Promise<number> {
        const promo = await this.promoCodeModel.findOne({ code: code.toUpperCase() }).exec();

        if (!promo) {
            throw new BadRequestException('Invalid promo code');
        }

        if (!promo.isActive) {
            throw new BadRequestException('Promo code is no longer active');
        }

        if (promo.expiresAt && new Date() > promo.expiresAt) {
            throw new BadRequestException('Promo code has expired');
        }

        if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
            throw new BadRequestException('Promo code usage limit reached');
        }

        // Increment usage
        await this.promoCodeModel.findByIdAndUpdate(promo._id, { $inc: { currentUses: 1 } }).exec();

        return promo.bonusAmount;
    }
}
