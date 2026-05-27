// send-otp.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'my-gym' })
  @IsOptional()
  @IsString()
  organizationSlug?: string;
}

// verify-otp.dto.ts
export class VerifyOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
}

// login.dto.ts
export class LoginDto {
  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  password: string;
}

// refresh-token.dto.ts
export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
