import { IsOptional, IsString, IsNumber, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class MemberQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() expiringIn?: number;
}

export class UpdateMemberDto {
  name?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  medicalNotes?: string;
  bloodGroup?: string;
  goal?: string;
  targetWeight?: number;
  currentWeight?: number;
  height?: number;
  trainerId?: string;
  notes?: string;
}

export class AssignMembershipDto {
  @ApiProperty() @IsString() planId: string;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty() @IsNumber() amountPaid: number;
}
