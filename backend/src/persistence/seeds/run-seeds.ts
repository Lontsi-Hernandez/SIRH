import { AppDataSource } from '../data-source';
import { seedDatabase } from './database-seeder';

async function run() {
  try {
    console.log('🔌 Connexion à la base de données...');
    await AppDataSource.initialize();
    console.log('✅ Base de données connectée !');

    console.log('⚙️ Synchronisation du schéma de la base de données (Auto-creation of tables)...');
    await AppDataSource.synchronize();
    console.log('✅ Schéma synchronisé avec succès !');

    await seedDatabase(AppDataSource);

    console.log('🔌 Fermeture de la connexion...');
    await AppDataSource.destroy();
    console.log('👋 Seeding complété avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seeding de la base de données :', error);
    process.exit(1);
  }
}

run();
