import { Module } from '@nestjs/common';
import { MtnService } from './mtn.service';
import { MtnController } from './mtn.controller';

@Module({
    controllers: [MtnController],
    providers: [MtnService],
    exports: [MtnService]
})
export class MtnModule { }
