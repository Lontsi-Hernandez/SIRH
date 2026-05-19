import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { Tenant } from '../../domain/entities/tenant.entity';

// TODO: Ajouter TenantsController et handlers CQRS

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([Tenant])],
  exports: [TypeOrmModule],
})
export class TenantsModule {}
