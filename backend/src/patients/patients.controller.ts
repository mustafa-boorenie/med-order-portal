import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PatientsService } from './patients.service';

@ApiTags('Patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all patients or search by query' })
  @ApiResponse({
    status: 200,
    description: 'List of patients',
  })
  async findAll(@Query('search') search?: string) {
    return this.patientsService.findAll(search);
  }
}