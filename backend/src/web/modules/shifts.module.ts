import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Shift } from '../../domain/entities/shift.entity';
import { TimeEntry } from '../../domain/entities/user.entity';
@Module({ imports: [CqrsModule, TypeOrmModule.forFeature([Shift, TimeEntry])], exports: [TypeOrmModule] })
export class ShiftsModule {}
