// Seeder Runner - Entry point to run all database seeders
// Run with: npm run seed

import { runAllSeeders } from './index';

console.log('=================================================');
console.log('           APNA VYAPAR DATABASE SEEDER          ');
console.log('=================================================\n');

// Import models to ensure they're loaded
import '../models';

runAllSeeders()
  .then(() => {
    console.log('\n✅ Seeding process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding process failed:', error);
    process.exit(1);
  });

