import { Controller, Get, Req, Headers, Ip } from '@nestjs/common';
import { Request } from 'express';

@Controller('debug-diagnostics')
export class DebugController {
    @Get()
    getDebugInfo(@Req() req: Request, @Headers() headers: any, @Ip() ip: string) {
        return {
            status: 'online',
            version: '0.0.5', // Hardcoded to verify deployment
            timestamp: new Date().toISOString(),
            clientIp: ip,
            headers: {
                host: headers.host,
                origin: headers.origin,
                'user-agent': headers['user-agent'],
                'x-forwarded-for': headers['x-forwarded-for'],
                'x-real-ip': headers['x-real-ip'],
            },
            env: {
                NODE_ENV: process.env.NODE_ENV,
                PORT: process.env.PORT,
                // Don't expose sensitive secrets, just existence
                HAS_MONGO_URI: !!process.env.MONGO_URI,
                HAS_STRIPE_KEY: !!process.env.STRIPE_SECRET_KEY,
            }
        };
    }
}
