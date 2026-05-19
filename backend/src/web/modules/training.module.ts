import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Training } from '../../domain/entities/training.entity';
@Module({ imports: [CqrsModule, TypeOrmModule.forFeature([Training])], exports: [TypeOrmModule] })
export class TrainingModule {}
