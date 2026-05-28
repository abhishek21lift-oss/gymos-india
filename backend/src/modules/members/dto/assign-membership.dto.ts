import { IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignMembershipDto {
  @ApiProperty()
  @IsString()
  planId: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsNumber()
  amountPaid: number;
}
