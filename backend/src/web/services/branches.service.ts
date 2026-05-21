import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../../domain/entities/branch.entity';

export interface CreateBranchDto {
  name: string;
  code?: string;
  address?: string;
  managerId?: string;
}

export interface UpdateBranchDto extends Partial<CreateBranchDto> {}

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly repo: Repository<Branch>,
  ) {}

  async findAll(tenantId: string): Promise<Branch[]> {
    return this.repo.find({
      where: { tenantId },
      order: { name: 'ASC' },
      relations: ['manager'],
    });
  }

  async findOne(id: string, tenantId: string): Promise<Branch> {
    const branch = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['manager'],
    });
    if (!branch) throw new NotFoundException('Succursale introuvable');
    return branch;
  }

  async create(dto: CreateBranchDto, tenantId: string): Promise<Branch> {
    const branch = this.repo.create({ ...dto, tenantId });
    return this.repo.save(branch);
  }

  async update(id: string, dto: UpdateBranchDto, tenantId: string): Promise<Branch> {
    const branch = await this.findOne(id, tenantId);
    Object.assign(branch, dto);
    return this.repo.save(branch);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const branch = await this.findOne(id, tenantId);
    await this.repo.remove(branch);
  }
}
