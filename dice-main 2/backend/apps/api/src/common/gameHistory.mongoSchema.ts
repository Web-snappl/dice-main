// /src/common/gameHistory.mongoSchema
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema()
export class GameHistoryModel extends Document {
    @Prop({ required: false })
    uid: string;

    @Prop({ required: true })
    displayName: string;

    @Prop({ required: true })
    rollDiceResult: number

    @Prop({ required: true })
    winner: boolean

    @Prop({ required: true })
    winsAgainst: number

    @Prop({ required: false })
    dice1: number

    @Prop({ required: false })
    dice2: number

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const gameHistory = SchemaFactory.createForClass(GameHistoryModel)
