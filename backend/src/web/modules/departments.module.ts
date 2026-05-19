// Stubs pour les modules restants — à implémenter en Phase 1 & 2

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Department } from '../../domain/entities/department.entity';
@Module({ imports: [CqrsModule, TypeOrmModule.forFeature([Department])], exports: [TypeOrmModule] })
export class DepartmentsModule {}
