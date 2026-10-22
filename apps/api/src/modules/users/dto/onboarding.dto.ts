import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { SETTABLE_ONBOARDING_STATES } from '../onboarding';

export class SetOnboardingDto {
  @ApiProperty({ enum: SETTABLE_ONBOARDING_STATES, example: 'done' })
  @IsIn(SETTABLE_ONBOARDING_STATES, { message: 'Estado da apresentação inválido.' })
  state!: 'later' | 'done';
}
