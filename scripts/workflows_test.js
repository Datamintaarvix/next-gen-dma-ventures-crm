const fs = require('fs');
const path = require('path');

const leadsStore = require('../lib/storage/leads-store.ts');
const admissionsStore = require('../lib/storage/admissions-store.ts');
const paymentsStore = require('../lib/storage/payments-store.ts');
const studentsStore = require('../lib/storage/students-store.ts');
const batchesStore = require('../lib/storage/batches-store.ts');
const coursesStore = require('../lib/storage/courses-store.ts');
const counsellingStore = require('../lib/storage/counselling-store.ts');
const placementsStore = require('../lib/storage/placements-store.ts');

console.log('Testing stores availability...');
