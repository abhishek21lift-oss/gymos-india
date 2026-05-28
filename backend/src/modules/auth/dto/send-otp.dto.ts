import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ example: 'my-gym' })
  @IsOptional()
  @IsString()
  organizationSlug?: string;
}
