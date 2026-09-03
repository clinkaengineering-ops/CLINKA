/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const enPath = path.join('/home/mohamedtalal/Documents/CLINKA/frontend/i18n/en.json');
const arPath = path.join('/home/mohamedtalal/Documents/CLINKA/frontend/i18n/ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

if (!en.inv) en.inv = {};
Object.assign(en.inv, {
  "status_pending": "Pending",
  "status_accepted": "Accepted",
  "status_declined": "Declined",
  "status_cancelled": "Cancelled",
  "status_expired": "Expired"
});

if (!ar.inv) ar.inv = {};
Object.assign(ar.inv, {
  "status_pending": "قيد الانتظار",
  "status_accepted": "مقبول",
  "status_declined": "مرفوض",
  "status_cancelled": "ملغى",
  "status_expired": "منتهي"
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2) + '\n', 'utf8');

console.log('Successfully patched translations!');
