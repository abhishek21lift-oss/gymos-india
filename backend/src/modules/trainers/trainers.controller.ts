import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TrainersService } from './trainers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('trainers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trainers')
export class TrainersController {
  constructor(private trainersService: TrainersService) {}
}
