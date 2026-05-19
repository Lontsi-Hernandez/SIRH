import { DataSource } from 'typeorm';
import { Tenant } from '../../domain/entities/tenant.entity';
import { Employee, EmployeeStatus, UserRole } from '../../domain/entities/employee.entity';
import { Department } from '../../domain/entities/department.entity';
import { Position } from '../../domain/entities/position.entity';
import { User } from '../../domain/entities/user.entity';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const tenantRepo = dataSource.getRepository(Tenant);
  const employeeRepo = dataSource.getRepository(Employee);
  const departmentRepo = dataSource.getRepository(Department);
  const positionRepo = dataSource.getRepository(Position);
  const userRepo = dataSource.getRepository(User);

  // Check if seeding is already done
  const tenantCount = await tenantRepo.count();
  if (tenantCount > 0) {
    console.log('✅ Base de données déjà initialisée. Skipping seeding...');
    return;
  }

  console.log('🌱 Début du peuplement de la base de données (Seeding)...');

  // 1. Créer le Tenant par défaut
  const tenant = tenantRepo.create({
    name: 'SIRH Québec Inc.',
    slug: 'quebec-inc',
    industry: 'Technologie',
    website: 'https://quebec-inc.sirh.ca',
    contactEmail: 'contact@quebec-inc.com',
    province: 'QC',
    maxEmployees: 100,
    isActive: true,
    subscriptionPlan: 'enterprise',
  });
  await tenantRepo.save(tenant);
  console.log(`🏢 Tenant créé : ${tenant.name} (${tenant.id})`);

  // 2. Créer les Départements
  const deptHR = departmentRepo.create({
    name: 'Ressources Humaines',
    code: 'HR',
    tenantId: tenant.id,
  });
  const deptIT = departmentRepo.create({
    name: 'Ingénierie',
    code: 'IT',
    tenantId: tenant.id,
  });
  const deptAdmin = departmentRepo.create({
    name: 'Direction Générale',
    code: 'EXEC',
    tenantId: tenant.id,
  });
  await departmentRepo.save([deptHR, deptIT, deptAdmin]);
  console.log('📁 Départements créés : RH, Ingénierie, Direction');

  // 3. Créer les Postes
  const posHRDir = positionRepo.create({
    title: 'Directeur des Ressources Humaines',
    description: 'Responsable du département RH',
    departmentId: deptHR.id,
    tenantId: tenant.id,
  });
  const posDev = positionRepo.create({
    title: 'Développeur Senior',
    description: 'Développeur Full-Stack Senior',
    departmentId: deptIT.id,
    tenantId: tenant.id,
  });
  const posCEO = positionRepo.create({
    title: 'Chef de la direction',
    description: 'CEO de l\'entreprise',
    departmentId: deptAdmin.id,
    tenantId: tenant.id,
  });
  await positionRepo.save([posHRDir, posDev, posCEO]);
  console.log('💼 Postes créés : Directeur RH, Développeur, CEO');

  // 4. Créer les Employés par défaut
  const empCEO = employeeRepo.create({
    employeeNumber: 'EMP-001',
    firstName: 'Jean',
    lastName: 'Tremblay',
    email: 'ceo@quebec-inc.com',
    phoneNumber: '+1-514-555-0101',
    status: EmployeeStatus.ACTIVE,
    role: UserRole.ADMIN,
    hireDate: new Date('2024-01-01'),
    annualSalary: 150000,
    departmentId: deptAdmin.id,
    positionId: posCEO.id,
    tenantId: tenant.id,
  });

  const empHR = employeeRepo.create({
    employeeNumber: 'EMP-002',
    firstName: 'Sophie',
    lastName: 'Gagnon',
    email: 'hr@quebec-inc.com',
    phoneNumber: '+1-514-555-0102',
    status: EmployeeStatus.ACTIVE,
    role: UserRole.HR,
    hireDate: new Date('2024-02-01'),
    annualSalary: 85000,
    departmentId: deptHR.id,
    positionId: posHRDir.id,
    tenantId: tenant.id,
  });

  const empDev = employeeRepo.create({
    employeeNumber: 'EMP-003',
    firstName: 'Marc-André',
    lastName: 'Roy',
    email: 'developer@quebec-inc.com',
    phoneNumber: '+1-514-555-0103',
    status: EmployeeStatus.ACTIVE,
    role: UserRole.EMPLOYEE,
    hireDate: new Date('2024-03-01'),
    annualSalary: 95000,
    departmentId: deptIT.id,
    positionId: posDev.id,
    tenantId: tenant.id,
  });

  await employeeRepo.save([empCEO, empHR, empDev]);
  console.log('👥 Employés créés : Jean Tremblay (CEO), Sophie Gagnon (HR), Marc-André Roy (Dev)');

  // Assigner les managers
  deptAdmin.managerId = empCEO.id;
  deptHR.managerId = empHR.id;
  await departmentRepo.save([deptAdmin, deptHR]);

  // 5. Créer les utilisateurs liés dans le schéma (pour mapping Keycloak)
  // Note: keycloakId est nul initialement et sera mappé lors de la première connexion
  const userCEO = userRepo.create({
    email: empCEO.email,
    isActive: true,
    employeeId: empCEO.id,
    tenantId: tenant.id,
  });

  const userHR = userRepo.create({
    email: empHR.email,
    isActive: true,
    employeeId: empHR.id,
    tenantId: tenant.id,
  });

  const userDev = userRepo.create({
    email: empDev.email,
    isActive: true,
    employeeId: empDev.id,
    tenantId: tenant.id,
  });

  await userRepo.save([userCEO, userHR, userDev]);
  console.log('🔒 Comptes utilisateurs créés pour la base de données (attente de liaison Keycloak)');

  console.log('🚀 Seeding de base de données terminé avec succès !');
}
