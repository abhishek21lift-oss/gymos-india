import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RenewalsService } from './renewals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('renewals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('renewals')
export class RenewalsController {
  constructor(private renewalsService: RenewalsService) {}
}
