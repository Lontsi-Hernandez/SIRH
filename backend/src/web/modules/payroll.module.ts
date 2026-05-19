import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Payroll } from '../../domain/entities/payroll.entity';
@Module({ imports: [CqrsModule, TypeOrmModule.forFeature([Payroll])], exports: [TypeOrmModule] })
export class PayrollModule {}
