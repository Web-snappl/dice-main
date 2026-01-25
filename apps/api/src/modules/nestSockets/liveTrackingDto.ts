

import { IsString, MinLength } from 'class-validator'


export class LiveTrackingDto {
    @IsString()
    @MinLength(6)
    uid: string

    @IsString()
    displayName: string
}



