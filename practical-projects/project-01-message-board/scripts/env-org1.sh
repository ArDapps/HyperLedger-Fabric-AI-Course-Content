#!/usr/bin/env bash

# هذا الملف يجهز terminal ليعمل كأنه Admin تابع لـ Org1.
# نستخدمه قبل أوامر peer chaincode query/invoke الخاصة بـ Org1.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$PROJECT_DIR/scripts/resolve-fabric-samples.sh"
resolve_fabric_samples_path || return 1 2>/dev/null || exit 1

# نضيف أدوات Fabric مثل peer و configtxgen إلى PATH.
export PATH="$FABRIC_SAMPLES_PATH/bin:$PATH"

# هذا المسار يحتوي ملفات إعداد Fabric CLI.
export FABRIC_CFG_PATH="$FABRIC_SAMPLES_PATH/config"

# test-network يستخدم TLS، لذلك لازم CLI يعرف شهادات TLS.
export CORE_PEER_TLS_ENABLED=true

# MSP ID يحدد المنظمة التي نمثلها في هذا الـ terminal.
export CORE_PEER_LOCALMSPID=Org1MSP

# شهادة TLS الخاصة بـ peer0 في Org1.
export CORE_PEER_TLS_ROOTCERT_FILE="$FABRIC_SAMPLES_PATH/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"

# هوية Admin الخاصة بـ Org1. هذه الشهادة والمفتاح يوقعان أوامر CLI.
export CORE_PEER_MSPCONFIGPATH="$FABRIC_SAMPLES_PATH/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"

# عنوان peer الذي سنرسل له أوامر query/invoke.
export CORE_PEER_ADDRESS=localhost:7051
