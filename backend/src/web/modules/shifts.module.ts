import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Shift } from '../../domain/entities/shift.entity';
import { TimeEntry } from '../../domain/entities/user.entity';
import { Employee } from '../../domain/entities/employee.entity';
import { ShiftsService } from '../services/shifts.service';
import { ShiftsController } from '../controllers/shifts.controller';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([Shift, TimeEntry, Employee])],
  controllers: [ShiftsController],
  providers: [ShiftsService],
  exports: [TypeOrmModule, ShiftsService],
})
export class ShiftsModule {}
