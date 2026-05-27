// create-member.dto.ts
import { IsString, IsOptional, IsEmail, IsEnum, IsNumber, IsDateString, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Gender { MALE = 'MALE', FEMALE = 'FEMALE', OTHER = 'OTHER' }
export enum GoalType {
  WEIGHT_LOSS = 'WEIGHT_LOSS', MUSCLE_GAIN = 'MUSCLE_GAIN',
  STRENGTH = 'STRENGTH', ENDURANCE = 'ENDURANCE',
  FLEXIBILITY = 'FLEXIBILITY', GENERAL_FITNESS = 'GENERAL_FITNESS',
}

export class CreateMemberDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() phone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() alternatePhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional({ enum: Gender }) @IsOptional() @IsEnum(Gender) gender?: Gender;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyRelation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() medicalNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bloodGroup?: string;
  @ApiPropertyOptional({ enum: GoalType }) @IsOptional() @IsEnum(GoalType) goal?: GoalType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() targetWeight?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() currentWeight?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() height?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referredBy?: string;
}
