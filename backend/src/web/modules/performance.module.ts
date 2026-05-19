import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Review, Goal } from '../../domain/entities/review.entity';
@Module({ imports: [CqrsModule, TypeOrmModule.forFeature([Review, Goal])], exports: [TypeOrmModule] })
export class PerformanceModule {}
