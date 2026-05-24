#!/usr/bin/env bash
set -euo pipefail

# هذا السكريبت يقرأ كل الرسائل من منظور Org2.
# لا يكتب شيئًا على الـ ledger، لذلك يستخدم peer chaincode query.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# نجهز terminal بهوية Org2.
source "$PROJECT_DIR/scripts/env-org2.sh"

# نقرأ من نفس channel ونفس chaincode، لكن الاتصال هنا يكون على peer Org2.
peer chaincode query \
  -C mychannel \
  -n messages \
  -c '{"function":"GetAllMessages","Args":[]}'
