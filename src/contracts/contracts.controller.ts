import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtCookieGuard } from 'src/common/guard/jwt-cookie.guard';

@Controller('employee-contracts')
@UseGuards(JwtCookieGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly contractService: ContractsService) {}

  @Post(':userId')
  @Roles('HRM', 'ADMIN')
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateContractDto,
  ) {
    return await this.contractService.createContract(userId, dto);
  }

  @Get(':id')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.contractService.getContractById(id);
  }

  @Get('user/:userId')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async getUserContracts(@Param('userId', ParseIntPipe) userId: number) {
    return await this.contractService.getUserContracts(userId);
  }

  @Get('user/:userId/active')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER', 'PROJECT_MANAGER')
  async getActiveContract(@Param('userId', ParseIntPipe) userId: number) {
    return await this.contractService.getActiveContract(userId);
  }

  @Put(':id')
  @Roles('HRM', 'ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractDto,
  ) {
    return await this.contractService.updateContract(id, dto);
  }

  @Put(':id/terminate')
  @Roles('HRM', 'ADMIN')
  async terminate(
    @Param('id', ParseIntPipe) id: number,
    @Body('terminationDate') terminationDate: Date,
  ) {
    return await this.contractService.terminateContract(id, terminationDate);
  }

  @Get('expiring-soon')
  @Roles('HRM', 'ADMIN')
  async getExpiringSoon(@Query('days', ParseIntPipe) days: number = 30) {
    return await this.contractService.getContractsExpiringSoon(days);
  }

  @Delete(':id')
  @Roles('HRM', 'ADMIN')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.contractService.deleteContract(id);
    return { message: 'Contract deleted successfully' };
  }
}
