/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const enPath = path.join('/home/mohamedtalal/Documents/CLINKA/frontend/i18n/en.json');
const arPath = path.join('/home/mohamedtalal/Documents/CLINKA/frontend/i18n/ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

en["proj.status.awaitingPayment"] = "Awaiting Payment";
ar["proj.status.awaitingPayment"] = "في انتظار الدفع";

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2) + '\n', 'utf8');

console.log('Successfully patched status keys!');
