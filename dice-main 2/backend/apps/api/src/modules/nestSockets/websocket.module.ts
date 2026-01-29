// websocket.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppGateway } from './gateway.sockets';
import { LiveUser, LiveUserSchema } from './liveUsers.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: LiveUser.name, schema: LiveUserSchema }]),
    ],
    providers: [AppGateway],
    exports: [AppGateway],
})
export class WebsocketModule { }