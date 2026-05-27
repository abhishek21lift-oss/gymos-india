import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Req, HttpCode, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberQueryDto } from './dto/member-query.dto';
import { AssignMembershipDto } from './dto/assign-membership.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER')
  @ApiOperation({ summary: 'Add new member' })
  create(@Body() dto: CreateMemberDto, @Req() req: any) {
    return this.membersService.create(dto, req.user.branchId, req.user.id);
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER')
  @ApiOperation({ summary: 'Get all members with filters' })
  findAll(@Query() query: MemberQueryDto, @Req() req: any) {
    return this.membersService.findAll(req.user.branchId, query);
  }

  @Get('search')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER')
  @ApiOperation({ summary: 'Search member by phone' })
  searchByPhone(@Query('phone') phone: string, @Req() req: any) {
    return this.membersService.searchByPhone(phone, req.user.branchId);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'TRAINER')
  @ApiOperation({ summary: 'Get member by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.findOne(id);
  }

  @Get(':id/stats')
  @Roles('OWNER', 'MANAGER', 'TRAINER')
  @ApiOperation({ summary: 'Get member statistics' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.getMemberStats(id);
  }

  @Put(':id')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Update member' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberDto,
    @Req() req: any,
  ) {
    return this.membersService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Deactivate member' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.membersService.remove(id, req.user.id);
  }

  @Post(':id/membership')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Assign membership plan to member' })
  assignMembership(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignMembershipDto,
  ) {
    return this.membersService.assignMembership(
      id, dto.planId, new Date(dto.startDate), dto.amountPaid,
    );
  }

  @Post(':id/qr/regenerate')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Regenerate member QR code' })
  regenerateQr(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.regenerateQr(id);
  }
}
