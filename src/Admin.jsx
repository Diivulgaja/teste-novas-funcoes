// src/Admin.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Trash2, Clock, Check, Loader2 } from 'lucide-react';

const ADMIN_PASSWORD = '071224'; // sua senha (conforme solicitado)
const FIRESTORE_COLLECTION = 'doceeser_pedidos';

const STATUS_LABELS = {
  novo: 'Novo',
  preparando: 'Preparando',
  pronto: 'Pronto',
  entregue: 'Entregue'
};

export default function Admin() {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem('doceeser_admin'));
  const [passwordInput, setPasswordInput] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showNewOrderBanner, setShowNewOrderBanner] = useState(false);

 // Pedir permissão para notificações ao carregar
useEffect(() => {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}, []);

// OBSERVADOR COM ALERTA DE PEDIDOS NOVOS
useEffect(() => {
  if (!isAuth) return;
  setLoading(true);

  // tenta usar ding.mp3, se existir
  let audio;
  try { audio = new Audio('/ding.mp3'); } catch { audio = null; }

  const playBeep = () => {
    if (audio) {
      audio.play().catch(() => fallbackBeep());
    } else {
      fallbackBeep();
    }
  };

  const fallbackBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 200);
    } catch (_) {}
  };

  // onde ficam IDs já vistos
  let seen = new Set();

  const q = query(
    collection(db, FIRESTORE_COLLECTION),
    orderBy("createdAt", "desc")
  );

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const novos = docs.filter(d => !seen.has(d.id));

      docs.forEach(d => seen.add(d.id));
      setOrders(docs);

      // disparar alertas para novos pedidos
      if (novos.length > 0) {
        novos.forEach(p => {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Novo pedido recebido!", {
              body: `Pedido #${p.id} - R$ ${Number(p.total).toFixed(2)}`,
              tag: p.id
            });
            // ativa banner visual animado
    setShowNewOrderBanner(true);
    setTimeout(() => setShowNewOrderBanner(false), 5000);
}
          }
          playBeep();
        });
      }

      setLoading(false);
    },
    (err) => {
      console.error("Erro:", err);
      setLoading(false);
    }
  );

  return () => unsub();
}, [isAuth]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      localStorage.setItem('doceeser_admin', '1');
      setIsAuth(true);
    } else {
      alert('Senha incorreta.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doceeser_admin');
    setIsAuth(false);
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTION, orderId), { status: newStatus });
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status. Veja o console.');
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Painel Admin — Doce É Ser</h2>
          <p className="text-sm text-gray-600 mb-4">Digite a senha para acessar o painel.</p>
          <input type="password" value={passwordInput} onChange={(e)=>setPasswordInput(e.target.value)} placeholder="Senha" className="w-full p-2 border rounded mb-4" />
          <div className="flex gap-2">
            <button className="flex-1 bg-amber-700 text-white py-2 rounded">Entrar</button>
            <button type="button" onClick={()=>{setPasswordInput('');}} className="px-4 py-2 border rounded">Limpar</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Painel de Pedidos — Doce É Ser</h1>
            <p className="text-sm text-gray-600">Acesse e gerencie pedidos em tempo real.</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="p-2 border rounded bg-white">
              <option value="all">Todos</option>
              <option value="novo">Novo</option>
              <option value="preparando">Preparando</option>
              <option value="pronto">Pronto</option>
              <option value="entregue">Entregue</option>
            </select>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded">Sair</button>
          </div>
        </header>
<header> ... </header>

{showNewOrderBanner && (
  <div className="mb-4 p-4 bg-amber-600 text-white font-semibold rounded-lg shadow animate-pulse text-center">
    🔔 Novo pedido chegando!
  </div>
)}

<main>
  ...
</main>

        <main>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.length === 0 ? (
                <div className="col-span-full bg-white p-6 rounded shadow text-center">Nenhum pedido encontrado.</div>
              ) : filtered.map(order => (
                <div key={order.id} className="bg-white p-4 rounded shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">Pedido: <span className="text-amber-600">{order.id}</span></div>
                      <div className="text-sm text-gray-600">Status: <strong>{STATUS_LABELS[order.status] || order.status}</strong></div>
                      <div className="text-xs text-gray-500">Criado: {order.createdAt && order.createdAt.toDate ? new Date(order.createdAt.toDate()).toLocaleString() : (order.createdAt ? String(order.createdAt) : '')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{order.total ? `R$ ${Number(order.total).toFixed(2).replace('.',',')}` : ''}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-700">
                    <div className="font-semibold">Cliente</div>
                    <div>{order.customer?.nome || '—'}</div>
                    <div className="text-xs text-gray-500">{order.customer?.telefone || ''}</div>
                    <div className="text-xs text-gray-500">{order.customer?.rua ? `${order.customer.rua}, ${order.customer.numero || ''} — ${order.customer.bairro || ''}` : ''}</div>
                  </div>

                  <div className="mt-3 text-sm">
                    <div className="font-semibold">Itens</div>
                    <ul className="list-disc ml-5 text-xs text-gray-700">
                      {Array.isArray(order.items) ? order.items.map((it, idx) => (
                        <li key={idx}>{(it.quantity || 1)}x {it.name} {it.toppings ? `(+${it.toppings.join(', ')})` : ''}</li>
                      )) : <li>—</li>}
                    </ul>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button onClick={()=>updateStatus(order.id, 'preparando')} className="px-3 py-1 bg-amber-500 text-white rounded">Preparando</button>
                    <button onClick={()=>updateStatus(order.id, 'pronto')} className="px-3 py-1 bg-green-600 text-white rounded">Pronto</button>
                    <button onClick={()=>updateStatus(order.id, 'entregue')} className="px-3 py-1 bg-gray-600 text-white rounded">Entregue</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


// -----------------------------------------------------------------
// Also update your main.jsx to render Admin on /admin path. Below is
// a ready-to-paste `src/main.jsx` that chooses App or Admin based on
// the current pathname. Replace your existing main.jsx with this.

/*
// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Admin from './Admin';
import './styles/tailwind.css';

const root = createRoot(document.getElementById('root'));
const pathname = window.location.pathname || '/';

if (pathname.startsWith('/admin')) {
  root.render(<React.StrictMode><Admin /></React.StrictMode>);
} else {
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
*/
