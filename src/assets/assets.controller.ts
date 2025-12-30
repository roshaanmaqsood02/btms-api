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
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateAssetDto } from './dto/create-assets.dto';
import { UpdateAssetDto } from './dto/update-assets.dto';
import { AssetsService } from './assets.service';

@Controller('assets')
@UseGuards(JwtCookieGuard, RolesGuard)
export class AssetsController {
  constructor(private readonly assetService: AssetsService) {}

  @Post(':userId')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async assign(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateAssetDto,
  ) {
    return await this.assetService.assignAsset(userId, dto);
  }

  @Get(':id')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.assetService.getAssetById(id);
  }

  @Get('user/:userId')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async getUserAssets(@Param('userId', ParseIntPipe) userId: number) {
    return await this.assetService.getUserAssets(userId);
  }

  @Get('user/:userId/active')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER', 'PROJECT_MANAGER')
  async getActiveAssets(@Param('userId', ParseIntPipe) userId: number) {
    return await this.assetService.getActiveAssets(userId);
  }

  @Get('search')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async search(@Query('q') searchTerm: string) {
    return await this.assetService.searchAssets(searchTerm);
  }

  @Get('status/:status')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async getByStatus(@Param('status') status: string) {
    return await this.assetService.getAssetsByStatus(status as any);
  }

  @Put(':id')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssetDto,
  ) {
    return await this.assetService.updateAsset(id, dto);
  }

  @Put(':id/return')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async returnAsset(
    @Param('id', ParseIntPipe) id: number,
    @Body('returnNotes') returnNotes?: string,
  ) {
    return await this.assetService.returnAsset(id, returnNotes);
  }

  @Delete(':id')
  @Roles('HRM', 'ADMIN')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.assetService.deleteAsset(id);
    return { message: 'Asset deleted successfully' };
  }
}
