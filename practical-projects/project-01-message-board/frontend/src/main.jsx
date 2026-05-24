import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  MessageSquarePlus,
  Network,
  RefreshCw,
  Search,
  Send,
  Server
} from 'lucide-react';
import './styles.css';

// روابط الـ API الافتراضية:
// Org1 API يعمل على port 4000، و Org2 API يعمل على port 4001.
// يمكن تغييرهم عند التشغيل باستخدام VITE_ORG1_API_URL و VITE_ORG2_API_URL.
const ORG_APIS = {
  org1: import.meta.env.VITE_ORG1_API_URL || 'http://localhost:4000',
  org2: import.meta.env.VITE_ORG2_API_URL || 'http://localhost:4001'
};

const orgLabels = {
  org1: 'Org1 API',
  org2: 'Org2 API'
};

function App() {
  const [activeOrg, setActiveOrg] = useState('org1');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState({ type: 'idle', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    id: `msg-${Date.now()}`,
    author: 'bahaa',
    body: ''
  });

  const apiBaseUrl = ORG_APIS[activeOrg];

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return messages;
    }

    return messages.filter((message) => (
      message.id.toLowerCase().includes(query)
      || message.author.toLowerCase().includes(query)
      || message.body.toLowerCase().includes(query)
    ));
  }, [messages, search]);

  useEffect(() => {
    loadMessages(activeOrg);
  }, [activeOrg]);

  async function loadMessages(org = activeOrg) {
    setIsLoading(true);
    setSelectedMessage(null);
    setHistory([]);

    try {
      const data = await requestJson(`${ORG_APIS[org]}/messages`);
      setMessages(data);
      setStatus({
        type: 'success',
        text: `تم تحميل ${data.length} رسالة من ${orgLabels[org]}`
      });
    } catch (error) {
      setMessages([]);
      setStatus({
        type: 'error',
        text: formatApiError(error, org)
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function createMessage(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const created = await requestJson(`${apiBaseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      setForm({
        id: `msg-${Date.now()}`,
        author: form.author,
        body: ''
      });
      setStatus({
        type: 'success',
        text: `تمت إضافة الرسالة ${created.id} على الـ ledger`
      });
      await loadMessages(activeOrg);
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loadHistory(message) {
    setSelectedMessage(message);
    setHistory([]);

    try {
      const data = await requestJson(`${apiBaseUrl}/messages/${message.id}/history`);
      setHistory(data);
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.message
      });
    }
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Hyperledger Fabric</p>
          <h1>لوحة رسائل مشتركة بين Org1 و Org2</h1>
        </div>

        <div className="network-status" aria-label="Network summary">
          <Network size={18} />
          <span>mychannel</span>
          <span className="dot" />
          <span>chaincode: messages</span>
        </div>
      </section>

      <section className="control-band">
        <div className="org-switcher" aria-label="API organization selector">
          <button
            className={activeOrg === 'org1' ? 'active' : ''}
            onClick={() => setActiveOrg('org1')}
            type="button"
          >
            <Server size={17} />
            Org1
          </button>
          <button
            className={activeOrg === 'org2' ? 'active' : ''}
            onClick={() => setActiveOrg('org2')}
            type="button"
          >
            <Server size={17} />
            Org2
          </button>
        </div>

        <div className="api-pill">
          {apiBaseUrl}
        </div>

        <button className="icon-button" onClick={() => loadMessages()} type="button" title="تحديث الرسائل">
          {isLoading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
        </button>
      </section>

      {status.text && (
        <section className={`notice ${status.type}`}>
          {status.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{status.text}</span>
        </section>
      )}

      <section className="workspace">
        <aside className="composer-panel">
          <div className="section-heading">
            <MessageSquarePlus size={20} />
            <h2>إضافة رسالة</h2>
          </div>

          <form onSubmit={createMessage} className="message-form">
            <label>
              Message ID
              <input
                value={form.id}
                onChange={(event) => setForm({ ...form, id: event.target.value })}
                required
              />
            </label>

            <label>
              Author
              <input
                value={form.author}
                onChange={(event) => setForm({ ...form, author: event.target.value })}
                required
              />
            </label>

            <label>
              Message
              <textarea
                value={form.body}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
                required
                rows="5"
              />
            </label>

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
              <span>إرسال للـ Fabric</span>
            </button>
          </form>
        </aside>

        <section className="messages-panel">
          <div className="section-heading split">
            <div>
              <h2>الرسائل على الـ ledger</h2>
              <p>{filteredMessages.length} من {messages.length} رسالة</p>
            </div>

            <label className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="بحث"
              />
            </label>
          </div>

          <div className="message-list">
            {isLoading && (
              <div className="empty-state">
                <Loader2 className="spin" size={22} />
                <span>جاري تحميل الرسائل من Fabric API</span>
              </div>
            )}

            {!isLoading && filteredMessages.length === 0 && (
              <div className="empty-state">
                <MessageSquarePlus size={22} />
                <span>لا توجد رسائل معروضة حاليًا</span>
              </div>
            )}

            {!isLoading && filteredMessages.map((message) => (
              <article className="message-card" key={message.id}>
                <div>
                  <h3>{message.body}</h3>
                  <p>{message.id} · {message.author}</p>
                </div>
                <div className="message-meta">
                  <span>
                    <Clock3 size={15} />
                    {formatDate(message.createdAt)}
                  </span>
                  <button onClick={() => loadHistory(message)} type="button">
                    <History size={16} />
                    History
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="history-panel">
          <div className="section-heading">
            <History size={20} />
            <h2>Transaction History</h2>
          </div>

          {!selectedMessage && (
            <div className="empty-state compact">
              <span>اختار رسالة لعرض سجلها</span>
            </div>
          )}

          {selectedMessage && (
            <div className="history-content">
              <div className="history-title">
                <strong>{selectedMessage.id}</strong>
                <span>{history.length} transaction</span>
              </div>

              {history.map((item) => (
                <article className="history-item" key={item.txId}>
                  <strong>{item.isDelete ? 'Delete' : 'Write'}</strong>
                  <span>{formatDate(item.timestamp)}</span>
                  <code>{shortTx(item.txId)}</code>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

function formatApiError(error, org) {
  return `${orgLabels[org]} غير متاح الآن. شغل الـ API أو تأكد من FABRIC_SAMPLES_PATH. التفاصيل: ${error.message}`;
}

function formatDate(value) {
  if (!value) {
    return 'غير معروف';
  }

  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function shortTx(txId) {
  if (!txId) {
    return 'no tx id';
  }

  return `${txId.slice(0, 10)}...${txId.slice(-6)}`;
}

createRoot(document.getElementById('root')).render(<App />);
