const fs = require('fs');

const en = JSON.parse(fs.readFileSync('./frontend/i18n/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('./frontend/i18n/ar.json', 'utf8'));

const results = [];
for (const key in en) {
  const val = en[key];
  const isPlaceholderKey = key.toLowerCase().includes('ph') || key.toLowerCase().includes('placeholder');
  const isPlaceholderVal = val.toLowerCase().includes('enter ') || val.toLowerCase().includes('e.g.') || val.toLowerCase().includes('مثال') || val.toLowerCase().includes('محمد') || val.toLowerCase().includes('john doe');
  
  if (isPlaceholderKey || isPlaceholderVal) {
    results.push({
      key,
      en: val,
      ar: ar[key] || "MISSING"
    });
  }
}

// Add a few known problematic ones
const manualKeys = ["side.searchPlaceholder", "help.namePh", "help.emailPh", "bal.withdrawBankFullNamePh"];

for (const key of manualKeys) {
    if (!results.find(r => r.key === key)) {
        results.push({key, en: en[key], ar: ar[key]});
    }
}

fs.writeFileSync('./placeholders.json', JSON.stringify(results, null, 2));
console.log(`Extracted ${results.length} placeholders.`);
