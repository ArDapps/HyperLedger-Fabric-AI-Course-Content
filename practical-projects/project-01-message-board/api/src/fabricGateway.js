'use strict';

const crypto = require('node:crypto');
const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');
const grpc = require('@grpc/grpc-js');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');

// أسماء الـ channel والـ chaincode. يمكن تغييرها من environment variables.
const CHANNEL_NAME = process.env.CHANNEL_NAME || 'mychannel';
const CHAINCODE_NAME = process.env.CHAINCODE_NAME || 'messages';
const ORG = process.env.ORG || '1';

// هذه الدالة تجهز الاتصال بـ Fabric وتعيد contract جاهز للاستدعاء.
// الـ API يستخدمها في كل request ثم يغلق الاتصال بعد انتهاء العملية.
async function getContract() {
  // نحدد هل التطبيق يعمل كـ Org1 أو Org2.
  const orgConfig = getOrgConfig(ORG);

  // gRPC هو البروتوكول الذي يستخدمه Fabric Gateway للتواصل مع peer.
  const client = await newGrpcConnection(orgConfig);

  // Gateway يحتاج identity certificate + private key signer.
  const gateway = connect({
    client,
    identity: await newIdentity(orgConfig),
    signer: await newSigner(orgConfig),
    hash: hash.sha256,
    evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
    endorseOptions: () => ({ deadline: Date.now() + 15000 }),
    submitOptions: () => ({ deadline: Date.now() + 5000 }),
    commitStatusOptions: () => ({ deadline: Date.now() + 60000 })
  });

  // نختار channel ثم chaincode contract الذي سنستدعي دواله.
  const network = gateway.getNetwork(CHANNEL_NAME);
  const contract = network.getContract(CHAINCODE_NAME);

  return {
    contract,
    close: () => {
      gateway.close();
      client.close();
    }
  };
}

// هنا نرسم خريطة الملفات الخاصة بكل منظمة في test-network.
// Org1 يستخدم peer على port 7051، و Org2 يستخدم peer على port 9051.
function getOrgConfig(org) {
  const fabricSamplesPath = resolveFabricSamplesPath();

  const testNetworkPath = path.resolve(fabricSamplesPath, 'test-network');

  if (org === '2') {
    return {
      mspId: 'Org2MSP',
      peerEndpoint: 'localhost:9051',
      peerHostAlias: 'peer0.org2.example.com',
      cryptoPath: path.join(testNetworkPath, 'organizations/peerOrganizations/org2.example.com'),
      userPath: 'users/User1@org2.example.com/msp',
      tlsCertPath: 'peers/peer0.org2.example.com/tls/ca.crt'
    };
  }

  return {
    mspId: 'Org1MSP',
    peerEndpoint: 'localhost:7051',
    peerHostAlias: 'peer0.org1.example.com',
    cryptoPath: path.join(testNetworkPath, 'organizations/peerOrganizations/org1.example.com'),
    userPath: 'users/User1@org1.example.com/msp',
    tlsCertPath: 'peers/peer0.org1.example.com/tls/ca.crt'
  };
}

function resolveFabricSamplesPath() {
  const configuredPath = process.env.FABRIC_SAMPLES_PATH;
  const defaultPath = path.join(process.env.HOME || '', 'fabric-samples');
  const placeholderPaths = new Set([
    '/absolute/path/to/fabric-samples',
    '/path/to/your/fabric-samples'
  ]);

  if (configuredPath && !placeholderPaths.has(configuredPath)) {
    if (!fsSync.existsSync(path.join(configuredPath, 'test-network'))) {
      throw new Error(`FABRIC_SAMPLES_PATH is not valid: ${configuredPath}`);
    }

    return configuredPath;
  }

  if (!fsSync.existsSync(path.join(defaultPath, 'test-network'))) {
    throw new Error(`Cannot find fabric-samples. Set FABRIC_SAMPLES_PATH or install it at ${defaultPath}`);
  }

  return defaultPath;
}

// إنشاء اتصال TLS آمن مع peer.
async function newGrpcConnection(orgConfig) {
  // نقرأ شهادة TLS الخاصة بالـ peer حتى يثق التطبيق في الاتصال.
  const tlsRootCert = await fs.readFile(path.join(orgConfig.cryptoPath, orgConfig.tlsCertPath));
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);

  return new grpc.Client(orgConfig.peerEndpoint, tlsCredentials, {
    'grpc.ssl_target_name_override': orgConfig.peerHostAlias
  });
}

// تحميل certificate الخاصة بالمستخدم الذي سيوقع الطلبات.
async function newIdentity(orgConfig) {
  const certDirectory = path.join(orgConfig.cryptoPath, orgConfig.userPath, 'signcerts');
  const certPath = await firstFile(certDirectory);
  const credentials = await fs.readFile(certPath);

  return {
    mspId: orgConfig.mspId,
    credentials
  };
}

// تحميل private key وتحويلها إلى signer.
// الـ signer يثبت لـ Fabric أن الطلب صادر من صاحب الـ certificate.
async function newSigner(orgConfig) {
  const keyDirectory = path.join(orgConfig.cryptoPath, orgConfig.userPath, 'keystore');
  const keyPath = await firstFile(keyDirectory);
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);

  return signers.newPrivateKeySigner(privateKey);
}

// داخل مجلدات crypto الخاصة بـ Fabric أسماء الملفات تكون مولدة تلقائيًا.
// لذلك نأخذ أول ملف موجود بدل كتابة الاسم يدويًا.
async function firstFile(directory) {
  const files = await fs.readdir(directory);
  if (files.length === 0) {
    throw new Error(`No files found in ${directory}`);
  }

  return path.join(directory, files[0]);
}

module.exports = {
  getContract
};
