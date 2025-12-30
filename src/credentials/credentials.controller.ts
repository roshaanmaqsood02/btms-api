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
import { JwtCookieGuard } from 'src/common/guard/jwt-cookie.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { CreateCredentialDto } from './dto/create-credentials.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateCredentialDto } from './dto/update-credentials.dto';
import { CredentialsService } from './credentials.service';

@Controller('credentials')
@UseGuards(JwtCookieGuard, RolesGuard)
export class CredentialsController {
  constructor(private readonly credentialService: CredentialsService) {}

  @Post(':userId')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateCredentialDto,
  ) {
    return await this.credentialService.createCredential(userId, dto);
  }

  @Get(':id')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.credentialService.getCredentialById(id);
  }

  @Get('user/:userId')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async getUserCredentials(@Param('userId', ParseIntPipe) userId: number) {
    return await this.credentialService.getUserCredentials(userId);
  }

  @Get('user/:userId/type/:type')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async getByType(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('type') type: string,
  ) {
    return await this.credentialService.getCredentialsByType(userId, type);
  }

  @Get('expiring-soon')
  @Roles('HRM', 'ADMIN')
  async getExpiringSoon(@Query('days', ParseIntPipe) days: number = 7) {
    return await this.credentialService.getExpiringCredentials(days);
  }

  @Put(':id')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCredentialDto,
  ) {
    return await this.credentialService.updateCredential(id, dto);
  }

  @Put(':id/password')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('newPassword') newPassword: string,
  ) {
    return await this.credentialService.updatePassword(id, newPassword);
  }

  @Get(':id/password')
  @Roles('HRM', 'ADMIN')
  async getPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('masterPassword') masterPassword: string,
  ) {
    return await this.credentialService.getCredentialPassword(
      id,
      masterPassword,
    );
  }

  @Put(':id/deactivate')
  @Roles('HRM', 'ADMIN')
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    return await this.credentialService.deactivateCredential(id);
  }

  @Delete(':id')
  @Roles('HRM', 'ADMIN')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.credentialService.deleteCredential(id);
    return { message: 'Credential deleted successfully' };
  }
}
