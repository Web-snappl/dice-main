import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema()
export class Merchant extends Document {
  @Prop({ required: false })
  uid: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false })
  photoURL: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const users = SchemaFactory.createForClass(Merchant)
