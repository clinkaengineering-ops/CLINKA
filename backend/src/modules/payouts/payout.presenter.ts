import type { WithdrawalRequest } from "../../generated/prisma/client";

type WithdrawalRow = WithdrawalRequest;

/** Strip encrypted banking fields before returning withdrawal rows to engineers. */
export function sanitizeWithdrawalForEngineer(row: WithdrawalRow) {
  const {
    ibanEncrypted: _iban,
    accountHolderNameEncrypted: _holder,
    swiftBicEncrypted: _swift,
    bankAddressEncrypted: _address,
    ...safe
  } = row;
  return safe;
}
