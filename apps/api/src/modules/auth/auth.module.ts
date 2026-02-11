import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { users } from './auth.mongoSchema';
import { PromoCode, PromoCodeSchema } from '../../admin/schemas/promo-code.schema';
import { PromoCodesService } from '../../admin/services/promo-codes.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: 'users', schema: users },
      { name: PromoCode.name, schema: PromoCodeSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, PromoCodesService],
  exports: [AuthService],
})
export class AuthModule { }
