import { IsOptional, IsString, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MemberQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() expiringIn?: number;
}

export class UpdateMemberDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() alternatePhone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() emergencyName?: string;
  @IsOptional() @IsString() emergencyPhone?: string;
  @IsOptional() @IsString() emergencyRelation?: string;
  @IsOptional() @IsString() medicalNotes?: string;
  @IsOptional() @IsString() bloodGroup?: string;
  @IsOptional() @IsString() goal?: string;
  @IsOptional() @IsNumber() targetWeight?: number;
  @IsOptional() @IsNumber() currentWeight?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsString() trainerId?: string;
  @IsOptional() @IsString() notes?: string;
}
