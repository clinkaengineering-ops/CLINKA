const fs = require('fs');

const en = JSON.parse(fs.readFileSync('./frontend/i18n/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('./frontend/i18n/ar.json', 'utf8'));

// Add new keys
const newEn = {
  "auth.passReq.min": "At least 8 characters",
  "auth.passReq.upper": "One uppercase letter",
  "auth.passReq.lower": "One lowercase letter",
  "auth.passReq.num": "One number",
  "auth.passReq.special": "One special character",
  "auth.passStrength.weak": "Weak",
  "auth.passStrength.fair": "Fair",
  "auth.passStrength.good": "Good",
  "auth.passStrength.strong": "Strong",
  "auth.passStrength.veryStrong": "Very Strong",
  "auth.passConfirm.match": "Passwords match",
  "auth.passConfirm.mismatch": "Passwords do not match",
};

const newAr = {
  "auth.passReq.min": "8 أحرف على الأقل",
  "auth.passReq.upper": "حرف كبير واحد على الأقل",
  "auth.passReq.lower": "حرف صغير واحد على الأقل",
  "auth.passReq.num": "رقم واحد على الأقل",
  "auth.passReq.special": "رمز خاص واحد على الأقل",
  "auth.passStrength.weak": "ضعيفة",
  "auth.passStrength.fair": "مقبولة",
  "auth.passStrength.good": "جيدة",
  "auth.passStrength.strong": "قوية",
  "auth.passStrength.veryStrong": "قوية جدًا",
  "auth.passConfirm.match": "كلمات المرور متطابقة",
  "auth.passConfirm.mismatch": "كلمات المرور غير متطابقة",
};

Object.assign(en, newEn);
Object.assign(ar, newAr);

// Update placeholders
en["auth.passwordPh"] = "Create a secure password";
ar["auth.passwordPh"] = "أنشئ كلمة مرور آمنة";
en["auth.passMin"] = "Create a secure password";
ar["auth.passMin"] = "أدخل كلمة المرور الجديدة";

en["auth.namePh"] = "Enter your full name";
ar["auth.namePh"] = "أدخل اسمك الكامل";

en["auth.emailPh"] = "Enter your email address";
ar["auth.emailPh"] = "أدخل عنوان بريدك الإلكتروني";

en["auth.nationalityPh"] = "Select your nationality";
ar["auth.nationalityPh"] = "اختر الجنسية";

en["st.bioPh"] = "Describe your professional background and skills";
ar["st.bioPh"] = "أدخل نبذة عن خلفيتك المهنية ومهاراتك";

en["auth.bioPh"] = "Describe your expertise and experience";
ar["auth.bioPh"] = "صف خبرتك ومجال تخصصك";

en["bal.withdrawEgyptIbanPh"] = "Enter your 29-character Egyptian IBAN";
ar["bal.withdrawEgyptIbanPh"] = "أدخل رقم الحساب المصرفي (IBAN) المكون من 29 حرفاً";

en["bal.withdrawBankFullNamePh"] = "Enter the full name on the account";
ar["bal.withdrawBankFullNamePh"] = "أدخل الاسم الكامل لصاحب الحساب";

en["bal.withdrawIbanPh"] = "Enter your full IBAN";
ar["bal.withdrawIbanPh"] = "أدخل رقم الحساب المصرفي الدولي (IBAN)";

en["bal.withdrawBankNamePh"] = "Enter the bank name";
ar["bal.withdrawBankNamePh"] = "أدخل اسم البنك";

en["bal.withdrawSwiftPh"] = "Enter your 8 or 11 character SWIFT code";
ar["bal.withdrawSwiftPh"] = "أدخل رمز SWIFT المكون من 8 أو 11 حرفاً";

en["bal.withdrawBankAddressPh"] = "Enter the bank branch city or region";
ar["bal.withdrawBankAddressPh"] = "أدخل مدينة أو منطقة فرع البنك";

en["bal.withdrawAccountPh"] = "Enter bank account number or IBAN";
ar["bal.withdrawAccountPh"] = "أدخل رقم الحساب البنكي أو IBAN";

en["pm.postModal.titlePh"] = "Enter project title";
ar["pm.postModal.titlePh"] = "أدخل عنوان المشروع";

en["pm.postModal.descPh"] = "Describe scope, deliverables, and timeline expectations";
ar["pm.postModal.descPh"] = "اكتب وصفاً مفصلاً لنطاق العمل والمخرجات المطلوبة";

en["pm.postModal.budgetPh"] = "Enter project budget";
ar["pm.postModal.budgetPh"] = "أدخل الميزانية المقدرة للمشروع";

en["pay.submitWork.urlPh"] = "Enter the URL to your deliverables";
ar["pay.submitWork.urlPh"] = "أدخل رابط ملفات التسليم";

en["checkout.addressPh"] = "Enter your billing address";
ar["checkout.addressPh"] = "أدخل عنوان الفوترة الخاص بك";

fs.writeFileSync('./frontend/i18n/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./frontend/i18n/ar.json', JSON.stringify(ar, null, 2));
console.log("Updated translation files");
