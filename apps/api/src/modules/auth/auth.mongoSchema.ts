import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

interface deferredOnboarding {
  hasMinimalAccount: boolean;
  pendingEarnings: number;
  earningsCount: number;
  onboardingNotificationSent: boolean;
}

// Role values: 'user' (player), 'moderator', 'admin' (administrator)
// Keep 'user'/'admin' for backward compatibility with existing player app
export type UserRole = 'user' | 'User' | 'moderator' | 'admin' | 'Admin';
export type UserStatus = 'active' | 'suspended' | 'banned';

@Schema()
export class User extends Document {
  @Prop({ required: false })
  uid: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ required: true })
  password: string;

  // Keep existing enum values for backward compatibility, add 'moderator'
  @Prop({ required: false, enum: ['user', 'User', 'moderator', 'admin', 'Admin'], default: 'user' })
  role: UserRole;

  // NEW: Account status for suspension/ban management
  @Prop({ required: false, enum: ['active', 'suspended', 'banned'], default: 'active' })
  status: UserStatus;

  // NEW: Suspension/ban tracking
  @Prop({ required: false })
  suspendedAt: Date;

  @Prop({ required: false })
  suspendedReason: string;

  @Prop({ required: false })
  bannedAt: Date;

  @Prop({ required: false })
  bannedReason: string;

  // NEW: Admin auth - bcrypt hashed password for admin/moderator
  @Prop({ required: false })
  adminPasswordHash: string;

  // NEW: Login tracking
  @Prop({ required: false })
  lastLoginAt: Date;

  @Prop({ required: false })
  lastLoginIp: string;

  @Prop({ required: false })
  photoURL: string;

  @Prop({ required: false })
  stripeAccountId: string;

  @Prop({ required: false })
  isStripeConnected: boolean;

  @Prop({ required: false, default: 0 })
  balance: number;

  @Prop({ type: Object, required: false })
  deferredOnboarding: deferredOnboarding;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const users = SchemaFactory.createForClass(User)
