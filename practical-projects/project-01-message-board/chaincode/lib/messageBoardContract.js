'use strict';

const { Contract } = require('fabric-contract-api');

// هذا هو الـ smart contract الخاص بلوحة الرسائل.
// كل دالة public هنا يمكن استدعاؤها كـ transaction من CLI أو REST API.
class MessageBoardContract extends Contract {
  // InitLedger تعمل أول بيانات تجريبية عند نشر chaincode.
  // الهدف منها أن نرى ledger فيه رسالة جاهزة قبل إضافة رسائل جديدة.
  async InitLedger(ctx) {
    const messages = [
      {
        id: 'welcome-1',
        author: 'org1-user',
        body: 'Welcome to the Fabric message board',
        createdAt: new Date(0).toISOString(),
        docType: 'message'
      }
    ];

    for (const message of messages) {
      // PutState تحفظ key/value في الـ world state.
      // المفتاح هنا هو message.id والقيمة هي الرسالة بصيغة JSON.
      await ctx.stub.putState(message.id, Buffer.from(JSON.stringify(message)));
    }

    return JSON.stringify(messages);
  }

  // CreateMessage هي transaction كتابة.
  // لذلك نستدعيها من التطبيق باستخدام submitTransaction وليس evaluateTransaction.
  async CreateMessage(ctx, id, author, body) {
    // نتحقق من المدخلات حتى لا نخزن رسالة ناقصة على الـ ledger.
    this._requireText(id, 'id');
    this._requireText(author, 'author');
    this._requireText(body, 'body');

    // ممنوع رسالتين بنفس id لأن الـ id هو مفتاح التخزين.
    const exists = await this.MessageExists(ctx, id);
    if (exists) {
      throw new Error(`Message ${id} already exists`);
    }

    const message = {
      id,
      author,
      body,
      createdAt: this._txTimestampToISOString(ctx),
      docType: 'message'
    };

    // هنا تتم الكتابة الفعلية في الـ world state.
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(message)));

    // Event اختياري يفيد التطبيقات الخارجية لو عايزة تسمع عند إنشاء رسالة.
    ctx.stub.setEvent('MessageCreated', Buffer.from(JSON.stringify(message)));

    return JSON.stringify(message);
  }

  // ReadMessage تقرأ رسالة واحدة من الـ ledger باستخدام id.
  // هذه دالة قراءة، لذلك التطبيق يستدعيها بـ evaluateTransaction.
  async ReadMessage(ctx, id) {
    this._requireText(id, 'id');

    const messageBytes = await ctx.stub.getState(id);
    if (!messageBytes || messageBytes.length === 0) {
      throw new Error(`Message ${id} does not exist`);
    }

    return messageBytes.toString();
  }

  // GetAllMessages تجيب كل الرسائل الموجودة في الـ world state.
  // getStateByRange('', '') معناها اقرأ كل المفاتيح المتاحة في chaincode namespace.
  async GetAllMessages(ctx) {
    const iterator = await ctx.stub.getStateByRange('', '');
    const messages = await this._readIterator(iterator);

    // نفلتر docType حتى لا نرجع أي أنواع بيانات أخرى قد نضيفها لاحقًا.
    return JSON.stringify(
      messages
        .filter((message) => message.docType === 'message')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    );
  }

  // مثال Query بسيط: رجع الرسائل الخاصة بمؤلف معين.
  async GetMessagesByAuthor(ctx, author) {
    this._requireText(author, 'author');

    const allMessages = JSON.parse(await this.GetAllMessages(ctx));
    return JSON.stringify(allMessages.filter((message) => message.author === author));
  }

  // History يقرأ سجل التغييرات الخاص بمفتاح واحد.
  // ده يوضح الفرق بين world state الحالي والـ blockchain log التاريخي.
  async GetMessageHistory(ctx, id) {
    this._requireText(id, 'id');

    const iterator = await ctx.stub.getHistoryForKey(id);
    const history = [];

    while (true) {
      const result = await iterator.next();

      if (result.value) {
        history.push({
          txId: result.value.txId,
          timestamp: this._timestampToISOString(result.value.timestamp),
          isDelete: result.value.isDelete,
          value: result.value.value && result.value.value.length > 0
            ? JSON.parse(result.value.value.toString('utf8'))
            : null
        });
      }

      if (result.done) {
        await iterator.close();
        break;
      }
    }

    return JSON.stringify(history);
  }

  // دالة مساعدة لمعرفة هل المفتاح موجود قبل الكتابة أو القراءة.
  async MessageExists(ctx, id) {
    const messageBytes = await ctx.stub.getState(id);
    return messageBytes && messageBytes.length > 0;
  }

  // دالة validation صغيرة تمنع النصوص الفارغة.
  _requireText(value, fieldName) {
    if (!value || value.trim().length === 0) {
      throw new Error(`${fieldName} is required`);
    }
  }

  // مهم جدًا: لا نستخدم new Date() مباشرة في chaincode.
  // الـ chaincode لازم يكون deterministic، لذلك نستخدم timestamp الخاص بالـ transaction من Fabric.
  _txTimestampToISOString(ctx) {
    return this._timestampToISOString(ctx.stub.getTxTimestamp());
  }

  // Fabric timestamp ممكن يرجع seconds كـ number أو string أو Long object.
  // هذه الدالة توحد كل الأشكال وتمنع خطأ Invalid time value.
  _timestampToISOString(timestamp) {
    if (!timestamp || timestamp.seconds === undefined || timestamp.seconds === null) {
      return null;
    }

    const seconds = this._longLikeToNumber(timestamp.seconds);
    const nanos = Number(timestamp.nanos || 0);
    const milliseconds = (seconds * 1000) + Math.floor(nanos / 1000000);
    const date = new Date(milliseconds);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  _longLikeToNumber(value) {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      return Number(value);
    }

    if (typeof value.toNumber === 'function') {
      return value.toNumber();
    }

    if (value.low !== undefined) {
      const low = Number(value.low);
      const high = Number(value.high || 0);
      return (high * 0x100000000) + (low >>> 0);
    }

    return Number(value);
  }

  // iterator في Fabric يرجع النتائج واحدة واحدة.
  // هذه الدالة تجمع النتائج كلها في array ثم تغلق iterator.
  async _readIterator(iterator) {
    const records = [];

    while (true) {
      const result = await iterator.next();

      if (result.value && result.value.value.toString()) {
        records.push(JSON.parse(result.value.value.toString('utf8')));
      }

      if (result.done) {
        await iterator.close();
        return records;
      }
    }
  }
}

module.exports = MessageBoardContract;
