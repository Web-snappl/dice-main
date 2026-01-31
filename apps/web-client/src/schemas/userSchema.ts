import { z } from 'zod'

export const UserSchema = z.object({
    uid: z.number(),
    displayName: z.string().min(1),
    email: z.string(),
    phone: z.string().optional(),
    website: z.string().optional(),
})

export type User = z.infer<typeof UserSchema>
