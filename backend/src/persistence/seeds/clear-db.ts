import { AppDataSource } from '../data-source';

async function clear() {
  try {
    console.log('🔌 Connexion à la base de données...');
    await AppDataSource.initialize();
    console.log('✅ Base de données connectée !');

    console.log('🧹 Nettoyage de la base de données (Drop Schema)...');
    await AppDataSource.dropDatabase();
    console.log('🗑️ Toutes les tables ont été supprimées avec succès !');

    console.log('🔌 Fermeture de la connexion...');
    await AppDataSource.destroy();
    console.log('👋 Nettoyage terminé.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage de la base de données :', error);
    process.exit(1);
  }
}

clear();
