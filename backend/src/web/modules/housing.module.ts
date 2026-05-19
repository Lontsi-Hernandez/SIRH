import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Housing, HousingAssignment } from '../../domain/entities/housing.entity';
import { Employee } from '../../domain/entities/employee.entity';
import { HousingController } from '../controllers/housing.controller';
import { HousingService } from '../services/housing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Housing, HousingAssignment, Employee]),
  ],
  controllers: [HousingController],
  providers: [HousingService],
  exports: [HousingService],
})
export class HousingModule {}
