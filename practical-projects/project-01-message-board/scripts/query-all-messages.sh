#!/usr/bin/env bash
set -euo pipefail

# هذا السكريبت يقرأ كل الرسائل من منظور Org1.
# query لا يمر على orderer لأنه قراءة فقط ولا يغير الـ ledger.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# نجهز terminal بهوية Org1.
source "$PROJECT_DIR/scripts/env-org1.sh"

# نقرأ من channel المشترك mychannel ومن chaincode messages.
peer chaincode query \
  -C mychannel \
  -n messages \
  -c '{"function":"GetAllMessages","Args":[]}'
