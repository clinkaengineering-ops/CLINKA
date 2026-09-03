/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const files = [
  "features/escrow/components/EscrowTransactionTable.tsx",
  "features/escrow/components/EscrowContractsList.tsx",
  "features/dashboard/Client/api/client-dashboard.api.ts",
  "features/escrow/hooks/useEscrow.ts",
  "features/escrow/hooks/useEngineerEscrow.ts",
  "features/settings/components/BillingSettingsTab.tsx",
  "features/escrow/pages/CheckoutClient.tsx",
];

for (const file of files) {
  const p = path.join("/home/mohamedtalal/Documents/CLINKA/frontend", file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, "utf-8");
    // Replace .amount with .amountUsd, but make sure not to break string interpolation where it might be {amount}
    // Actually, in TS, p.amount becomes p.amountUsd
    content = content.replace(/\.amount\b/g, ".amountUsd");
    fs.writeFileSync(p, content);
    console.log("Updated", file);
  }
}
