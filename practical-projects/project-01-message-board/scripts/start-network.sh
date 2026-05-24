#!/usr/bin/env bash
set -euo pipefail

# هذا السكريبت يشغل Fabric test-network وينشر chaincode الخاص بالرسائل.
# شغله من فولدر المشروع بعد ضبط FABRIC_SAMPLES_PATH.

# PROJECT_DIR هو مسار المشروع الحالي حتى نمرر مسار chaincode لـ network.sh.
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$PROJECT_DIR/scripts/resolve-fabric-samples.sh"
resolve_fabric_samples_path

# test-network هو المشروع الجاهز من Hyperledger Fabric samples.
TEST_NETWORK_DIR="$FABRIC_SAMPLES_PATH/test-network"

if [ ! -d "$TEST_NETWORK_DIR" ]; then
  echo "Cannot find test-network at: $TEST_NETWORK_DIR"
  exit 1
fi

cd "$TEST_NETWORK_DIR"

# ننظف أي شبكة قديمة حتى نبدأ من حالة واضحة.
./network.sh down

# نشغل الشبكة وننشئ channel باسم mychannel مع Fabric CA.
./network.sh up createChannel -ca -c mychannel

# ننشر chaincode:
# -ccn اسم chaincode
# -ccp مسار كود chaincode
# -ccl اللغة
# -cci الدالة التي تعمل عند التهيئة
./network.sh deployCC \
  -c mychannel \
  -ccn messages \
  -ccp "$PROJECT_DIR/chaincode" \
  -ccl javascript \
  -ccv 1.0 \
  -ccs 1 \
  -cci InitLedger

echo "Fabric message board network is ready."
