# Project 01 - Hyperledger Fabric Message Board

## الفكرة

ده أول مشروع تطبيقي بسيط على Hyperledger Fabric:

- عندنا شبكه Fabric فيها منظمتين: `Org1` و `Org2`.
- مستخدم من `Org1` يضيف رسالة على الـ blockchain.
- مستخدم من `Org2` يقدر يشوف الرسالة من نفس الـ channel.
- كل رسالة بتتخزن في الـ ledger ومعاها بيانات صاحبها وتاريخها.

الفكرة مقصودة تكون سهلة: بدل ما نبدأ بـ Supply Chain كبير، هنبدأ بـ "دفتر رسائل مشترك" عشان تفهم transaction flow عمليًا.

```text
Org1 User -> REST API -> Fabric Gateway -> Peer -> Chaincode -> Ledger
                                                              |
Org2 User -> REST API -> Fabric Gateway -> Peer -> Query -----+
```

## ماذا ستتعلم؟

- معنى Fabric network عمليًا.
- الفرق بين `invoke` و `query`.
- إزاي chaincode يكتب ويقرأ state.
- إزاي منظمتين يشتركوا في نفس الـ channel.
- إزاي REST API يكلم Fabric Gateway SDK.

## هيكل المشروع

```text
project-01-message-board/
  chaincode/             Smart contract الخاص بالرسائل
  api/                   Express REST API فوق Fabric Gateway
  scripts/               أوامر تشغيل الشبكة ونشر chaincode
  README.md              الشرح العملي
```

## المتطلبات

- Docker
- Node.js 18+
- Hyperledger Fabric samples

نزّل Fabric samples لو مش موجودة عندك:

```bash
curl -sSL https://bit.ly/2ysbOFE | bash -s
```

بعدها هيكون عندك فولدر اسمه غالبًا:

```text
fabric-samples/test-network
```

## تشغيل الشبكة

من داخل فولدر المشروع:

```bash
cd practical-projects/project-01-message-board
./scripts/start-network.sh
```

لو `fabric-samples` موجود في:

```text
$HOME/fabric-samples
```

فالسكريبت هيلاقيه تلقائيًا. لو موجود في مكان مختلف، وقتها فقط استخدم:

```bash
export FABRIC_SAMPLES_PATH=/real/path/to/fabric-samples
./scripts/start-network.sh
```

السكريبت هيعمل:

1. يقفل أي شبكة قديمة.
2. يشغل `test-network`.
3. ينشئ channel اسمه `mychannel`.
4. ينشر chaincode اسمه `messages`.

## تجربة chaincode من CLI

إضافة رسالة من Org1:

```bash
./scripts/invoke-create-message.sh msg1 user1 "Hello from Org1"
```

قراءة كل الرسائل:

```bash
./scripts/query-all-messages.sh
```

قراءة كل الرسائل من Peer الخاص بـ Org2:

```bash
./scripts/query-all-messages-org2.sh
```

قراءة رسالة واحدة:

```bash
./scripts/query-message.sh msg1
```

## تشغيل REST API

```bash
cd api
npm install
npm run start
```

الـ API افتراضيًا بيشتغل بهوية Org1 على:

```text
http://localhost:4000
```

### إضافة رسالة

```bash
curl -X POST http://localhost:4000/messages \
  -H "Content-Type: application/json" \
  -d '{"id":"msg2","author":"bahaa","body":"My first Fabric message"}'
```

### قراءة الرسائل

```bash
curl http://localhost:4000/messages
```

### تشغيل API كـ Org2

افتح terminal تاني:

```bash
cd practical-projects/project-01-message-board/api
ORG=2 PORT=4001 npm run start
```

اقرأ الرسائل من Org2:

```bash
curl http://localhost:4001/messages
```

لو Org2 شاف الرسالة اللي Org1 كتبها، يبقى فهمت أهم نقطة: المنظمتين على نفس الـ channel وبيقرأوا نفس الـ ledger.

## تشغيل واجهة React

بعد تشغيل الشبكة وتشغيل API الخاص بـ Org1 و Org2، افتح terminal جديد:

```bash
cd practical-projects/project-01-message-board/frontend
npm install
npm run dev
```

افتح:

```text
http://localhost:5173
```

الواجهة تعمل الآتي:

- تختار هل تقرأ من `Org1 API` أو `Org2 API`.
- تضيف رسالة جديدة على الـ ledger.
- تعرض كل الرسائل الموجودة في world state.
- تبحث داخل الرسائل.
- تعرض transaction history لأي رسالة.

لو روابط الـ API مختلفة عندك:

```bash
VITE_ORG1_API_URL=http://localhost:4000 VITE_ORG2_API_URL=http://localhost:4001 npm run dev
```

## شرح الـ Flow

### 1. المستخدم يبعت رسالة

المستخدم ينادي:

```http
POST /messages
```

الـ API يستخدم `contract.submitTransaction`.

ده معناه إننا بنعمل transaction هتتكتب في الـ ledger.

### 2. Peer ينفذ chaincode

الـ peer يشغل دالة:

```text
CreateMessage(id, author, body)
```

الدالة تتأكد إن الرسالة مش موجودة، وبعدها تعمل `PutState`.

### 3. Ordering service يرتب المعاملة

الـ transaction تدخل block وتتوزع على peers في channel.

### 4. كل منظمة تقدر تقرأ

Org1 و Org2 عندهم peers على نفس channel، لذلك Org2 يقدر يستخدم:

```http
GET /messages
```

ويشوف الرسائل المكتوبة.

## Chaincode functions

```text
InitLedger()
CreateMessage(id, author, body)
ReadMessage(id)
GetAllMessages()
GetMessagesByAuthor(author)
GetMessageHistory(id)
```

## API endpoints

```text
GET  /health
POST /messages
GET  /messages
GET  /messages/:id
GET  /messages/:id/history
GET  /authors/:author/messages
```

## إيقاف الشبكة

```bash
./scripts/stop-network.sh
```

## أسئلة مهمة للمذاكرة

- لماذا `CreateMessage` تستخدم `submitTransaction`؟
- لماذا `GetAllMessages` تستخدم `evaluateTransaction`؟
- ما الفرق بين world state والـ blockchain log؟
- لماذا Org2 يستطيع قراءة رسالة Org1؟
- ماذا سيحدث لو Org2 ليس عضوًا في channel؟

## الخطوة التالية

بعد ما تفهم المشروع ده، طوّره بإضافة:

- تسجيل المستخدم الحقيقي من certificate بدل تمرير `author` من body.
- صلاحيات: admin فقط يقدر يحذف رسالة.
- Events عند إنشاء رسالة.
- Frontend بسيط يعرض الرسائل live.
