import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { EducationService } from './education.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { JwtCookieGuard } from 'src/common/guard/jwt-cookie.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('educations')
@UseGuards(JwtCookieGuard, RolesGuard)
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @Post(':userId')
  @Roles('HRM', 'ADMIN')
  async create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateEducationDto,
  ) {
    return await this.educationService.createEducation(userId, dto);
  }

  @Get(':id')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.educationService.getEducationById(id);
  }

  @Get('user/:userId')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER')
  async getUserEducations(@Param('userId', ParseIntPipe) userId: number) {
    return await this.educationService.getUserEducations(userId);
  }

  @Get('user/:userId/latest')
  @Roles('HRM', 'ADMIN', 'OPERATION_MANAGER', 'PROJECT_MANAGER')
  async getLatestEducation(@Param('userId', ParseIntPipe) userId: number) {
    return await this.educationService.getLatestEducation(userId);
  }

  @Put(':id')
  @Roles('HRM', 'ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEducationDto,
  ) {
    return await this.educationService.updateEducation(id, dto);
  }

  @Delete(':id')
  @Roles('HRM', 'ADMIN')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.educationService.deleteEducation(id);
    return { message: 'Education record deleted successfully' };
  }
}
