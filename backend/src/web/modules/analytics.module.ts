import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Employee } from '../../domain/entities/employee.entity';
@Module({ imports: [CqrsModule, TypeOrmModule.forFeature([Employee])], exports: [TypeOrmModule] })
export class AnalyticsModule {}
