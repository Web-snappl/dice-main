// liveUsers.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class LiveUser extends Document {
  @Prop({ required: true })
  uid: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true })
  socketId: string;

  @Prop({ default: Date.now })
  connectedAt: Date;
}

export const LiveUserSchema = SchemaFactory.createForClass(LiveUser);