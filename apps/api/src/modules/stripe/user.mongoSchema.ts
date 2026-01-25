import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

interface deferredOnboarding {
  hasMinimalAccount: boolean;
  pendingEarnings: number;
  earningsCount: number;
  onboardingNotificationSent: boolean;
}

@Schema()
export class User extends Document {
  @Prop({ required: false })
  uid: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['user', 'User', 'admin', 'Admin'] })
  role: string;

  @Prop({ required: false })
  photoURL: string;

  @Prop({ required: false })
  stripeAccountId: string;

  @Prop({ required: false })
  isStripeConnected: boolean;

  @Prop({ type: Object, required: false })
  deferredOnboarding: deferredOnboarding;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const users = SchemaFactory.createForClass(User)
