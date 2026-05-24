'use strict';

const express = require('express');
const cors = require('cors');
const { getContract } = require('./fabricGateway');

const app = express();
const port = Number(process.env.PORT || 4000);

// يسمح لواجهة React أن تكلم الـ API حتى لو كانت على port مختلف.
app.use(cors());

// يجعل Express يفهم JSON القادم في body.
app.use(express.json());

// endpoint بسيط للتأكد أن السيرفر يعمل ومعرفة المنظمة المستخدمة.
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    org: process.env.ORG || '1'
  });
});

// إنشاء رسالة جديدة على الـ ledger.
// هذه عملية كتابة، لذلك نستخدم submitTransaction.
app.post('/messages', async (req, res, next) => {
  const { id, author, body } = req.body;
  let fabric;

  try {
    fabric = await getContract();
    const resultBytes = await fabric.contract.submitTransaction('CreateMessage', id, author, body);
    res.status(201).json(parseBuffer(resultBytes));
  } catch (error) {
    next(error);
  } finally {
    closeFabric(fabric);
  }
});

// قراءة كل الرسائل.
// هذه عملية قراءة فقط، لذلك نستخدم evaluateTransaction.
app.get('/messages', async (req, res, next) => {
  let fabric;

  try {
    fabric = await getContract();
    const resultBytes = await fabric.contract.evaluateTransaction('GetAllMessages');
    res.json(parseBuffer(resultBytes));
  } catch (error) {
    next(error);
  } finally {
    closeFabric(fabric);
  }
});

// قراءة رسالة واحدة باستخدام id.
app.get('/messages/:id', async (req, res, next) => {
  let fabric;

  try {
    fabric = await getContract();
    const resultBytes = await fabric.contract.evaluateTransaction('ReadMessage', req.params.id);
    res.json(parseBuffer(resultBytes));
  } catch (error) {
    next(error);
  } finally {
    closeFabric(fabric);
  }
});

// قراءة التاريخ الكامل لرسالة معينة.
// هذا يوضح audit trail في Hyperledger Fabric.
app.get('/messages/:id/history', async (req, res, next) => {
  let fabric;

  try {
    fabric = await getContract();
    const resultBytes = await fabric.contract.evaluateTransaction('GetMessageHistory', req.params.id);
    res.json(parseBuffer(resultBytes));
  } catch (error) {
    next(error);
  } finally {
    closeFabric(fabric);
  }
});

// قراءة رسائل مؤلف معين.
app.get('/authors/:author/messages', async (req, res, next) => {
  let fabric;

  try {
    fabric = await getContract();
    const resultBytes = await fabric.contract.evaluateTransaction('GetMessagesByAuthor', req.params.author);
    res.json(parseBuffer(resultBytes));
  } catch (error) {
    next(error);
  } finally {
    closeFabric(fabric);
  }
});

// error handler موحد حتى يرجع الـ API أخطاء JSON واضحة.
app.use((error, req, res, next) => {
  const status = error.message && error.message.includes('does not exist') ? 404 : 400;
  res.status(status).json({
    error: error.message
  });
});

app.listen(port, () => {
  console.log(`Message board API is running on http://localhost:${port}`);
});

// Fabric Gateway يرجع Buffer، ونحن نحوله إلى JSON مفهوم للـ API response.
function parseBuffer(buffer) {
  const text = Buffer.from(buffer).toString('utf8');
  return text ? JSON.parse(text) : {};
}

// نغلق gateway/client بعد كل request حتى لا نترك connections مفتوحة.
function closeFabric(fabric) {
  if (fabric) {
    fabric.close();
  }
}
