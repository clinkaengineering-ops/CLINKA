const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, 'src/modules/admin/admin.service.ts');
let adminContent = fs.readFileSync(adminPath, 'utf8');
// Fix admin.service.ts coverImageUrl
adminContent = adminContent.replace('item.imageUrl', 'item.coverImageUrl');
fs.writeFileSync(adminPath, adminContent);

const payPath = path.join(__dirname, 'src/modules/payments/payments.service.ts');
let payContent = fs.readFileSync(payPath, 'utf8');
// Fix AWAITING_PAYMENT in line 195 area
payContent = payContent.replace('if (project.status !== "IN_PROGRESS" && project.status !== "AWAITING_PAYMENT") {', 'if (project.status !== "IN_PROGRESS") {');
payContent = payContent.replace('if (\n    project.status !== "IN_PROGRESS" &&\n    project.status !== "AWAITING_PAYMENT"\n  ) {', 'if (project.status !== "IN_PROGRESS") {');
// Fallback if formatting differs
payContent = payContent.replace(/if\s*\(\s*project\.status\s*!==\s*"IN_PROGRESS"\s*&&\s*project\.status\s*!==\s*"AWAITING_PAYMENT"\s*\)\s*\{/g, 'if (project.status !== "IN_PROGRESS") {');

// Fix error messages
payContent = payContent.replace('"Escrow payment is only available for in-progress or awaiting payment projects"', '"Escrow payment is only available for in-progress projects"');
payContent = payContent.replace('"Manual payment is only available for in-progress or awaiting payment projects"', '"Manual payment is only available for in-progress projects"');

// Fix invitation block
payContent = payContent.replace(/,\s*invitation:\s*true/g, '');
const invitationBlockRegex = /if\s*\(payment\.invitation\)\s*\{\s*if\s*\(payment\.invitation\.status[\s\S]*?\}\s*\}/g;
payContent = payContent.replace(invitationBlockRegex, '');

fs.writeFileSync(payPath, payContent);
console.log('Fixed TypeScript errors');
