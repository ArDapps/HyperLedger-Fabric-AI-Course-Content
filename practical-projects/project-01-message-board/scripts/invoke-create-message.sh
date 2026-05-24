#!/usr/bin/env bash
set -euo pipefail

# هذا السكريبت يضيف رسالة جديدة على الـ ledger من خلال Org1.
# invoke يعني transaction كتابة: ستذهب للـ endorsing peers ثم orderer ثم commit.

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <message-id> <author> <body>"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# نجهز متغيرات Org1 حتى أمر peer يعرف الشهادة والـ MSP والـ peer address.
source "$PROJECT_DIR/scripts/env-org1.sh"

# تفاصيل الأمر:
# - نرسل المعاملة إلى orderer على localhost:7050.
# - نحدد channel باسم mychannel و chaincode باسم messages.
# - نمرر peer Org1 و peer Org2 لأن سياسة التصديق الافتراضية تحتاج المنظمتين.
# - نستدعي دالة CreateMessage مع id و author و body.
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$FABRIC_SAMPLES_PATH/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n messages \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$FABRIC_SAMPLES_PATH/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$FABRIC_SAMPLES_PATH/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c "{\"function\":\"CreateMessage\",\"Args\":[\"$1\",\"$2\",\"$3\"]}"
