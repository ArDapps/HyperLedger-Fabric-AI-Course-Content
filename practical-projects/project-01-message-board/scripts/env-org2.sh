#!/usr/bin/env bash

# هذا الملف يجهز terminal ليعمل كأنه Admin تابع لـ Org2.
# مفيد لإثبات أن Org2 يستطيع قراءة الرسائل التي كتبها Org1 على نفس channel.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$PROJECT_DIR/scripts/resolve-fabric-samples.sh"
resolve_fabric_samples_path || return 1 2>/dev/null || exit 1

# نضيف أدوات Fabric إلى PATH حتى يعمل أمر peer.
export PATH="$FABRIC_SAMPLES_PATH/bin:$PATH"

# إعدادات Fabric CLI العامة.
export FABRIC_CFG_PATH="$FABRIC_SAMPLES_PATH/config"

# تفعيل TLS لأن peers في test-network تعمل باتصال آمن.
export CORE_PEER_TLS_ENABLED=true

# MSP ID الخاص بـ Org2.
export CORE_PEER_LOCALMSPID=Org2MSP

# شهادة TLS الخاصة بـ peer0 في Org2.
export CORE_PEER_TLS_ROOTCERT_FILE="$FABRIC_SAMPLES_PATH/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"

# هوية Admin الخاصة بـ Org2.
export CORE_PEER_MSPCONFIGPATH="$FABRIC_SAMPLES_PATH/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"

# peer0 الخاص بـ Org2 يعمل على port 9051.
export CORE_PEER_ADDRESS=localhost:9051
