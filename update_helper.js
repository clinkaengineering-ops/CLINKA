const fs = require('fs');

const en = JSON.parse(fs.readFileSync('./frontend/i18n/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('./frontend/i18n/ar.json', 'utf8'));

en["auth.passReq.helper"] = "Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.";
ar["auth.passReq.helper"] = "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وحرف كبير، وحرف صغير، ورقم، ورمز خاص.";

fs.writeFileSync('./frontend/i18n/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./frontend/i18n/ar.json', JSON.stringify(ar, null, 2));
console.log("Updated helper");
