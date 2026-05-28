import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class RenewalsService {
  constructor(private prisma: PrismaService) {}
}
