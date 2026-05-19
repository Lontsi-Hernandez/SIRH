import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Leave } from '../../domain/entities/leave.entity';
@Module({ imports: [CqrsModule, TypeOrmModule.forFeature([Leave])], exports: [TypeOrmModule] })
export class LeavesModule {}
