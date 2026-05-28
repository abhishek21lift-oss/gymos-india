import { IsString, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignMembershipDto {
  @ApiProperty()
  @IsString()
  planId!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amountPaid!: number;
}
