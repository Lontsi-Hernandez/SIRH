import { DataSource } from 'typeorm';
import { Tenant } from '../../domain/entities/tenant.entity';
import { Employee, EmployeeStatus, UserRole } from '../../domain/entities/employee.entity';
import { Department } from '../../domain/entities/department.entity';
import { Position } from '../../domain/entities/position.entity';
import { User } from '../../domain/entities/user.entity';
import { Branch } from '../../domain/entities/branch.entity';
import { Shift, ShiftStatus } from '../../domain/entities/shift.entity';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const tenantRepo = dataSource.getRepository(Tenant);
  const branchRepo = dataSource.getRepository(Branch);
  const employeeRepo = dataSource.getRepository(Employee);
  const departmentRepo = dataSource.getRepository(Department);
  const positionRepo = dataSource.getRepository(Position);
  const userRepo = dataSource.getRepository(User);
  const shiftRepo = dataSource.getRepository(Shift);

  // 👑 S'assurer que le tenant système admin et son Platform Admin existent TOUJOURS
  let systemTenant = await tenantRepo.findOne({ where: { slug: 'system-admin' } });
  if (!systemTenant) {
    console.log('🌱 Création du tenant système global absent...');
    systemTenant = tenantRepo.create({
      name: 'HRMS SaaS Global Administration',
      slug: 'system-admin',
      industry: 'Administration',
      website: 'https://admin.sirh.ca',
      contactEmail: 'admin@hrms.com',
      province: 'QC',
      maxEmployees: 10,
      isActive: true,
      subscriptionPlan: 'enterprise',
    });
    await tenantRepo.save(systemTenant);
    console.log(`👑 Tenant Système créé : ${systemTenant.name}`);
  }

  let systemBranch = await branchRepo.findOne({ where: { tenantId: systemTenant.id, code: 'SYS' } });
  if (!systemBranch) {
    systemBranch = branchRepo.create({
      name: 'Administration Générale',
      code: 'SYS',
      address: 'Siège social SaaS, Montréal, QC',
      tenantId: systemTenant.id,
    });
    await branchRepo.save(systemBranch);
  }

  let empSysAdmin = await employeeRepo.findOne({ where: { email: 'admin@hrms.com', tenantId: systemTenant.id } });
  if (!empSysAdmin) {
    empSysAdmin = employeeRepo.create({
      employeeNumber: 'EMP-SYS-001',
      firstName: 'Global',
      lastName: 'Administrator',
      email: 'admin@hrms.com',
      phoneNumber: '+1-800-555-0100',
      status: EmployeeStatus.ACTIVE,
      role: UserRole.PLATFORM_ADMIN,
      hireDate: new Date('2024-01-01'),
      annualSalary: 200000,
      branchId: systemBranch.id,
      tenantId: systemTenant.id,
    });
    await employeeRepo.save(empSysAdmin);
  }

  let userSysAdmin = await userRepo.findOne({ where: { email: empSysAdmin.email, tenantId: systemTenant.id } });
  if (!userSysAdmin) {
    userSysAdmin = userRepo.create({
      email: empSysAdmin.email,
      isActive: true,
      employeeId: empSysAdmin.id,
      tenantId: systemTenant.id,
    });
    await userRepo.save(userSysAdmin);
    console.log('👑 Compte de Platform Admin créé : admin@hrms.com');
  }

  // Check if demo seeding should be done
  const tenantCount = await tenantRepo.count();
  if (tenantCount > 1) {
    // Forcer la mise à jour du rôle du CEO de Québec Inc
    const ceo = await employeeRepo.findOne({ where: { email: 'ceo@quebec-inc.com' } });
    if (ceo && ceo.role !== UserRole.SUPER_ADMIN) {
      ceo.role = UserRole.SUPER_ADMIN;
      await employeeRepo.save(ceo);
      console.log('✅ CEO mis à jour en SUPER_ADMIN.');
    }
    console.log('✅ Base de données déjà initialisée avec d\'autres entreprises. Skipping seeding of demo data...');
    return;
  }

  console.log('🌱 Début du peuplement de la base de données démo (Seeding)...');

  // ==========================================
  // 🏢 1. CRÉATION DU TENANT 1 : SIRH Québec Inc.
  // ==========================================
  const tenant1 = tenantRepo.create({
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
  await tenantRepo.save(tenant1);
  console.log(`🏢 Tenant 1 créé : ${tenant1.name} (${tenant1.id})`);

  // --- Succursales (Branches) pour Tenant 1 ---
  const branchMTL = branchRepo.create({
    name: 'Succursale de Montréal',
    code: 'MTL',
    address: '1000 Rue de la Gauchetière, Montréal, QC H3B 4W5',
    tenantId: tenant1.id,
  });
  const branchQBC = branchRepo.create({
    name: 'Succursale de Québec',
    code: 'QBC',
    address: '500 Grande Allée E, Québec, QC G1R 2J7',
    tenantId: tenant1.id,
  });
  await branchRepo.save([branchMTL, branchQBC]);
  console.log('🏢 Succursales Tenant 1 créées : Montréal (MTL), Québec (QBC)');

  // --- Départements pour Tenant 1 ---
  const deptHR_MTL = departmentRepo.create({
    name: 'Ressources Humaines (MTL)',
    code: 'HR-MTL',
    tenantId: tenant1.id,
    branchId: branchMTL.id,
  });
  const deptIT_MTL = departmentRepo.create({
    name: 'Ingénierie & IT (MTL)',
    code: 'IT-MTL',
    tenantId: tenant1.id,
    branchId: branchMTL.id,
  });
  const deptOps_QBC = departmentRepo.create({
    name: 'Opérations Terrain (QBC)',
    code: 'OPS-QBC',
    tenantId: tenant1.id,
    branchId: branchQBC.id,
  });
  await departmentRepo.save([deptHR_MTL, deptIT_MTL, deptOps_QBC]);
  console.log('📁 Départements Tenant 1 créés : RH (MTL), IT (MTL), Opérations (QBC)');

  // --- Postes pour Tenant 1 ---
  const posCEO_MTL = positionRepo.create({
    title: 'Chef de la direction',
    description: 'CEO de SIRH Québec Inc.',
    departmentId: deptIT_MTL.id,
    tenantId: tenant1.id,
  });
  const posHRDir_MTL = positionRepo.create({
    title: 'Directrice des Ressources Humaines',
    description: 'Responsable du recrutement et bien-être MTL',
    departmentId: deptHR_MTL.id,
    tenantId: tenant1.id,
  });
  const posDev_MTL = positionRepo.create({
    title: 'Développeur Full-Stack Senior',
    description: 'Architecture et développement des modules',
    departmentId: deptIT_MTL.id,
    tenantId: tenant1.id,
  });
  const posMgr_QBC = positionRepo.create({
    title: 'Gestionnaire de Succursale',
    description: 'Responsable des opérations régionales de Québec',
    departmentId: deptOps_QBC.id,
    tenantId: tenant1.id,
  });
  await positionRepo.save([posCEO_MTL, posHRDir_MTL, posDev_MTL, posMgr_QBC]);
  console.log('💼 Postes Tenant 1 créés : CEO, DRH, Développeur, Gestionnaire QBC');

  // --- Employés pour Tenant 1 ---
  const empCEO = employeeRepo.create({
    employeeNumber: 'EMP-T1-001',
    firstName: 'Jean',
    lastName: 'Tremblay',
    email: 'ceo@quebec-inc.com',
    phoneNumber: '+1-514-555-0101',
    status: EmployeeStatus.ACTIVE,
    role: UserRole.SUPER_ADMIN,
    hireDate: new Date('2024-01-01'),
    annualSalary: 160000,
    departmentId: deptIT_MTL.id,
    positionId: posCEO_MTL.id,
    branchId: branchMTL.id,
    tenantId: tenant1.id,
  });
  const empHR = employeeRepo.create({
    employeeNumber: 'EMP-T1-002',
    firstName: 'Sophie',
    lastName: 'Gagnon',
    email: 'hr@quebec-inc.com',
    phoneNumber: '+1-514-555-0102',
    status: EmployeeStatus.ACTIVE,
    role: UserRole.HR,
    hireDate: new Date('2024-02-01'),
    annualSalary: 85000,
    departmentId: deptHR_MTL.id,
    positionId: posHRDir_MTL.id,
    branchId: branchMTL.id,
    tenantId: tenant1.id,
  });
  const empDev = employeeRepo.create({
    employeeNumber: 'EMP-T1-003',
    firstName: 'Marc-André',
    lastName: 'Roy',
    email: 'developer@quebec-inc.com',
    phoneNumber: '+1-514-555-0103',
    status: EmployeeStatus.ACTIVE,
    role: UserRole.EMPLOYEE,
    hireDate: new Date('2024-03-01'),
    annualSalary: 95000,
    departmentId: deptIT_MTL.id,
    positionId: posDev_MTL.id,
    branchId: branchMTL.id,
    tenantId: tenant1.id,
  });
  const empMgrQBC = employeeRepo.create({
    employeeNumber: 'EMP-T1-004',
    firstName: 'Élise',
    lastName: 'Dubois',
    email: 'manager-mtl@quebec-inc.com', // Gardé tel quel ou remappé
    phoneNumber: '+1-418-555-0104',
    status: EmployeeStatus.ACTIVE,
    role: UserRole.MANAGER,
    hireDate: new Date('2024-04-15'),
    annualSalary: 75000,
    departmentId: deptOps_QBC.id,
    positionId: posMgr_QBC.id,
    branchId: branchQBC.id,
    tenantId: tenant1.id,
  });
  await employeeRepo.save([empCEO, empHR, empDev, empMgrQBC]);
  console.log('👥 Employés Tenant 1 créés.');

  // Assigner les managers dans les entités structurelles
  branchMTL.managerId = empCEO.id;
  branchQBC.managerId = empMgrQBC.id;
  await branchRepo.save([branchMTL, branchQBC]);

  deptIT_MTL.managerId = empCEO.id;
  deptHR_MTL.managerId = empHR.id;
  deptOps_QBC.managerId = empMgrQBC.id;
  await departmentRepo.save([deptIT_MTL, deptHR_MTL, deptOps_QBC]);

  // Comptes utilisateurs Tenant 1 (pour auth locale et Keycloak)
  const userCEOT1 = userRepo.create({ email: empCEO.email, isActive: true, employeeId: empCEO.id, tenantId: tenant1.id });
  const userHRT1 = userRepo.create({ email: empHR.email, isActive: true, employeeId: empHR.id, tenantId: tenant1.id });
  const userDevT1 = userRepo.create({ email: empDev.email, isActive: true, employeeId: empDev.id, tenantId: tenant1.id });
  const userMgrT1 = userRepo.create({ email: empMgrQBC.email, isActive: true, employeeId: empMgrQBC.id, tenantId: tenant1.id });
  await userRepo.save([userCEOT1, userHRT1, userDevT1, userMgrT1]);


  // ==========================================
  // 🏢 2. CRÉATION DU TENANT 2 : Horizon Tech Solutions
  // ==========================================
  const tenant2 = tenantRepo.create({
    name: 'Horizon Tech Solutions',
    slug: 'horizon-tech',
    industry: 'Logiciel & Cloud',
    website: 'https://horizon-tech.sirh.ca',
    contactEmail: 'contact@horizon-tech.com',
    province: 'ON',
    maxEmployees: 100,
    isActive: true,
    subscriptionPlan: 'growth',
  });
  await tenantRepo.save(tenant2);
  console.log(`🏢 Tenant 2 créé : ${tenant2.name} (${tenant2.id})`);

  // --- Succursales (Branches) pour Tenant 2 ---
  const branchTOR = branchRepo.create({
    name: 'Toronto Head Office',
    code: 'TOR',
    address: '250 Yonge St, Toronto, ON M5B 2L7',
    tenantId: tenant2.id,
  });
  const branchVAN = branchRepo.create({
    name: 'Vancouver office',
    code: 'VAN',
    address: '666 Burrard St, Vancouver, BC V6C 2X8',
    tenantId: tenant2.id,
  });
  await branchRepo.save([branchTOR, branchVAN]);
  console.log('🏢 Succursales Tenant 2 créées : Toronto (TOR), Vancouver (VAN)');

  // --- Départements pour Tenant 2 ---
  const deptEng_TOR = departmentRepo.create({
    name: 'Software Engineering (TOR)',
    code: 'SWE-TOR',
    tenantId: tenant2.id,
    branchId: branchTOR.id,
  });
  const deptCS_VAN = departmentRepo.create({
    name: 'Customer Success (VAN)',
    code: 'CS-VAN',
    tenantId: tenant2.id,
    branchId: branchVAN.id,
  });
  await departmentRepo.save([deptEng_TOR, deptCS_VAN]);
  console.log('📁 Départements Tenant 2 créés : Software (TOR), Success (VAN)');

  // --- Postes pour Tenant 2 ---
  const posCEO_TOR = positionRepo.create({
    title: 'President & CEO',
    description: 'CEO of Horizon Tech Solutions',
    departmentId: deptEng_TOR.id,
    tenantId: tenant2.id,
  });
  const posDev_TOR = positionRepo.create({
    title: 'Cloud Engineer',
    description: 'Infrastructure and AWS management',
    departmentId: deptEng_TOR.id,
    tenantId: tenant2.id,
  });
  const posCsMgr_VAN = positionRepo.create({
    title: 'Customer Success Manager',
    description: 'Leading client engagement team in West Coast',
    departmentId: deptCS_VAN.id,
    tenantId: tenant2.id,
  });
  await positionRepo.save([posCEO_TOR, posDev_TOR, posCsMgr_VAN]);
  console.log('💼 Postes Tenant 2 créés : President, Cloud Eng, CS Manager');

  // --- Employés pour Tenant 2 ---
  const empCEOT2 = employeeRepo.create({
    employeeNumber: 'EMP-T2-001',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'ceo@horizon-tech.com',
    phoneNumber: '+1-416-555-0201',
    status: EmployeeStatus.ACTIVE,
    role: UserRole.SUPER_ADMIN,
    hireDate: new Date('2024-01-01'),
    annualSalary: 180000,
    departmentId: deptEng_TOR.id,
    positionId: posCEO_TOR.id,
    branchId: branchTOR.id,
    tenantId: tenant2.id,
  });
  const empDevT2 = employeeRepo.create({
    employeeNumber: 'EMP-T2-002',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'developer@horizon-tech.com',
    phoneNumber: '+1-416-555-0202',
    status: EmployeeStatus.ACTIVE,
    role: UserRole.EMPLOYEE,
    hireDate: new Date('2024-05-01'),
    annualSalary: 98000,
    departmentId: deptEng_TOR.id,
    positionId: posDev_TOR.id,
    branchId: branchTOR.id,
    tenantId: tenant2.id,
  });
  const empCsMgrT2 = employeeRepo.create({
    employeeNumber: 'EMP-T2-003',
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'charlie@horizon-tech.com',
    phoneNumber: '+1-604-555-0203',
    status: EmployeeStatus.ACTIVE,
    role: UserRole.MANAGER,
    hireDate: new Date('2024-06-15'),
    annualSalary: 82000,
    departmentId: deptCS_VAN.id,
    positionId: posCsMgr_VAN.id,
    branchId: branchVAN.id,
    tenantId: tenant2.id,
  });
  await employeeRepo.save([empCEOT2, empDevT2, empCsMgrT2]);
  console.log('👥 Employés Tenant 2 créés.');

  // Assigner les managers
  branchTOR.managerId = empCEOT2.id;
  branchVAN.managerId = empCsMgrT2.id;
  await branchRepo.save([branchTOR, branchVAN]);

  deptEng_TOR.managerId = empCEOT2.id;
  deptCS_VAN.managerId = empCsMgrT2.id;
  await departmentRepo.save([deptEng_TOR, deptCS_VAN]);

  // Comptes utilisateurs Tenant 2
  const userCEOT2 = userRepo.create({ email: empCEOT2.email, isActive: true, employeeId: empCEOT2.id, tenantId: tenant2.id });
  const userDevT2 = userRepo.create({ email: empDevT2.email, isActive: true, employeeId: empDevT2.id, tenantId: tenant2.id });
  const userMgrT2 = userRepo.create({ email: empCsMgrT2.email, isActive: true, employeeId: empCsMgrT2.id, tenantId: tenant2.id });
  await userRepo.save([userCEOT2, userDevT2, userMgrT2]);


  // ==========================================
  // 🕒 3. PLANIFICATION ET POINTAGES (SHIFTS) DEMO
  // ==========================================
  console.log('🕒 Création de pointages et plannings (Shifts) pour démo...');
  
  const now = new Date();
  
  // Pointages pour Marc-André Roy (Developer @ Québec Inc.)
  const shift1 = shiftRepo.create({
    startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0, 0),
    endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 17, 0, 0),
    actualStartTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 8, 55, 0),
    actualEndTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 17, 5, 0),
    status: ShiftStatus.COMPLETED,
    location: 'Succursale de Montréal',
    locationLat: 45.5016889,
    locationLng: -73.567256,
    employeeId: empDev.id,
    tenantId: tenant1.id,
    notes: 'Journée standard complétée.',
  });

  const shift2 = shiftRepo.create({
    startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0),
    endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0),
    status: ShiftStatus.SCHEDULED,
    location: 'Succursale de Montréal',
    locationLat: 45.5016889,
    locationLng: -73.567256,
    employeeId: empDev.id,
    tenantId: tenant1.id,
    notes: 'Quart planifié pour aujourd\'hui.',
  });

  // Pointage pour Bob Johnson (Developer @ Horizon Tech Solutions)
  const shiftT2_1 = shiftRepo.create({
    startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0, 0),
    endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 17, 0, 0),
    actualStartTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 2, 0),
    actualEndTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 17, 0, 0),
    status: ShiftStatus.COMPLETED,
    location: 'Toronto Head Office',
    locationLat: 43.653226,
    locationLng: -79.383184,
    employeeId: empDevT2.id,
    tenantId: tenant2.id,
    notes: 'Remote/Office mixed.',
  });

  const shiftT2_2 = shiftRepo.create({
    startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0),
    endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0),
    status: ShiftStatus.SCHEDULED,
    location: 'Toronto Head Office',
    locationLat: 43.653226,
    locationLng: -79.383184,
    employeeId: empDevT2.id,
    tenantId: tenant2.id,
  });

  await shiftRepo.save([shift1, shift2, shiftT2_1, shiftT2_2]);
  console.log('✅ Pointages et plannings créés avec succès !');

  console.log('🚀 Seeding de base de données multi-tenant & multi-branch complété avec succès !');
}
