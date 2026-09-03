/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const enPath = path.join('/home/mohamedtalal/Documents/CLINKA/frontend/i18n/en.json');
const arPath = path.join('/home/mohamedtalal/Documents/CLINKA/frontend/i18n/ar.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// Delete the nested inv object if it exists
if (en.inv) delete en.inv;
if (ar.inv) delete ar.inv;

// Add flat keys to EN
Object.assign(en, {
  "inv.status_pending": "Pending",
  "inv.status_accepted": "Accepted",
  "inv.status_declined": "Declined",
  "inv.status_cancelled": "Cancelled",
  "inv.status_expired": "Expired",
  "inv.total": "invitations",
  "inv.sentOn": "Sent on",
  "inv.cancel": "Cancel Invitation"
});

// Add flat keys to AR
Object.assign(ar, {
  "inv.status_pending": "قيد الانتظار",
  "inv.status_accepted": "مقبول",
  "inv.status_declined": "مرفوض",
  "inv.status_cancelled": "ملغى",
  "inv.status_expired": "منتهي",
  "inv.total": "دعوات",
  "inv.sentOn": "أُرسلت في",
  "inv.cancel": "إلغاء الدعوة"
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2) + '\n', 'utf8');

console.log('Successfully patched flat keys!');
