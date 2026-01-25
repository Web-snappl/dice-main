import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Injectable, Logger, ValidationPipe } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, isValidObjectId } from 'mongoose'
import { LiveUser } from './liveUsers.schema';
import { LiveTrackingDto } from './liveTrackingDto'

@WebSocketGateway()
@Injectable()
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        @InjectModel(LiveUser.name) private readonly liveUserModel: Model<LiveUser>,
    ) { }

    @WebSocketServer() server: Server
    private logger: Logger = new Logger('AppGateway')

    @SubscribeMessage('msgToServer')
    handleMessage(@MessageBody() message: string): void {
        this.server.emit('msgToClient', message)
    }

    @SubscribeMessage('trackLiveUser')
    async trackLiveUser(
        @MessageBody(ValidationPipe) liveTrackingDto: LiveTrackingDto,
        @ConnectedSocket() client: Socket): Promise<void> {
        const { data, error } = await this.saveUserToMongoDb(liveTrackingDto.uid, liveTrackingDto.displayName, client.id)
        if (data) this.server.emit('msgToClient', `A new user is online | name: ${liveTrackingDto.displayName} , id: ${liveTrackingDto.uid}  `)
        if (error) this.server.emit('msgToClient', `Error saving user to mongo db | \n name: ${liveTrackingDto.displayName}, \n id: ${liveTrackingDto.uid} \n error:${error}`)
    }

    afterInit(server: Server) {
        this.logger.log('after init', server)
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`)
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`)
        this.removeUserFromMongoDb(client.id)
    }

    convertToMongoDbId(rawId: string) {
        const patch = rawId.substring(rawId.length - 6, rawId.length)
        return `abc123${patch}`
    }

    async saveUserToMongoDb(uid: string, displayName: string, socketId: string) {
        const validUid = isValidObjectId(uid) ? uid : this.convertToMongoDbId(uid)
        try {
            const data = await this.liveUserModel.findOneAndUpdate(
                { uid: validUid },
                { uid, displayName, socketId, connectedAt: new Date() },
                { upsert: true, new: true }
            ).exec();
            return { data: data, error: undefined }
        } catch (e) {
            return { data: undefined, error: e }
        }
    }

    async removeUserFromMongoDb(socketId: string) {
        try {
            await this.liveUserModel.deleteOne({ socketId: socketId }).exec();
        } catch (error) {
            this.logger.error(`Failed to remove user with socketId ${socketId}:`, error);
        }
    }
}
