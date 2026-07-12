const fs = require('fs');

const en = JSON.parse(fs.readFileSync('./frontend/i18n/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('./frontend/i18n/ar.json', 'utf8'));

en["auth.passwordStrength"] = "Password Strength";
ar["auth.passwordStrength"] = "قوة كلمة المرور";

fs.writeFileSync('./frontend/i18n/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./frontend/i18n/ar.json', JSON.stringify(ar, null, 2));
console.log("Updated auth.passwordStrength");
