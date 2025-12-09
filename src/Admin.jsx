// src/Admin.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Trash2, Clock, Check, Loader2 } from 'lucide-react';

const ADMIN_PASSWORD = "071224";
const FIRESTORE_COLLECTION = "doceeser_pedidos";

const STATUS_LABELS = {
  novo: "Novo",
  preparando: "Preparando",
  pronto: "Pronto",
  entregue: "Entregue",
};

// função para tocar som
function playBeep() {
  const audio = new Audio(
    "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
  );
  audio.volume = 1.0;
  audio.play().catch(() => {});
}

export default function Admin() {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem("doceeser_admin"));
  const [passwordInput, setPasswordInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showNewOrderBanner, setShowNewOrderBanner] = useState(false);

  useEffect(() => {
    if (!isAuth) return;

    setLoading(true);

    // pedir permissão para notificações
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    const q = query(
      collection(db, FIRESTORE_COLLECTION),
      orderBy("createdAt", "desc")
    );

    const seen = new Set(); // para evitar alerta duplicado

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const novos = docs.filter((d) => !seen.has(d.id));
        docs.forEach((d) => seen.add(d.id));

        setOrders(docs);

        // notificações + som para novos pedidos
        if (novos.length > 0) {
          novos.forEach((pedido) => {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Novo pedido recebido!", {
                body: `Pedido #${pedido.id} - R$ ${Number(pedido.total).toFixed(2)}`,
                tag: pedido.id,
              });
            }

            // Banner animado
            setShowNewOrderBanner(true);
            setTimeout(() => setShowNewOrderBanner(false), 5000);

            // Som
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
      localStorage.setItem("doceeser_admin", "1");
      setIsAuth(true);
    } else {
      alert("Senha incorreta.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("doceeser_admin");
    setIsAuth(false);
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, FIRESTORE_COLLECTION, orderId), {
        status: newStatus,
      });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      alert("Erro ao atualizar status.");
    }
  };

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  // ---------------------------
  // LOGIN SCREEN
  // ---------------------------
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white p-6 rounded-lg shadow"
        >
          <h2 className="text-xl font-bold mb-4">
            Painel Admin — Doce É Ser
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Digite a senha para acessar o painel.
          </p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Senha"
            className="w-full p-2 border rounded mb-4"
          />
          <div className="flex gap-2">
            <button className="flex-1 bg-amber-700 text-white py-2 rounded">
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setPasswordInput("")}
              className="px-4 py-2 border rounded"
            >
              Limpar
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ---------------------------
  // PAINEL PRINCIPAL
  // ---------------------------
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Cabeçalho */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Painel de Pedidos — Doce É Ser</h1>
            <p className="text-sm text-gray-600">
              Acompanhe pedidos em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded bg-white"
            >
              <option value="all">Todos</option>
              <option value="novo">Novo</option>
              <option value="preparando">Preparando</option>
              <option value="pronto">Pronto</option>
              <option value="entregue">Entregue</option>
            </select>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Sair
            </button>
          </div>
        </header>

        {/* Banner ANIMADO de novo pedido */}
        {showNewOrderBanner && (
          <div className="mb-4 p-4 bg-amber-600 text-white font-semibold rounded-lg shadow animate-pulse text-center">
            🔔 Novo pedido recebido!
          </div>
        )}

        {/* LISTA DE PEDIDOS */}
        <main>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.length === 0 ? (
                <div className="col-span-full bg-white p-6 rounded shadow text-center">
                  Nenhum pedido encontrado.
                </div>
              ) : (
                filtered.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-4 rounded shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">
                          Pedido:{" "}
                          <span className="text-amber-600">{order.id}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Status:{" "}
                          <strong>
                            {STATUS_LABELS[order.status] || order.status}
                          </strong>
                        </div>
                        <div className="text-xs text-gray-500">
                          Criado:{" "}
                          {order.createdAt?.toDate
                            ? new Date(
                                order.createdAt.toDate()
                              ).toLocaleString()
                            : ""}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {order.total
                            ? `R$ ${Number(order.total)
                                .toFixed(2)
                                .replace(".", ",")}`
                            : ""}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-700">
                      <div className="font-semibold">Cliente</div>
                      <div>{order.customer?.nome || "—"}</div>
                      <div className="text-xs text-gray-500">
                        {order.customer?.telefone}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.customer?.rua
                          ? `${order.customer.rua}, ${
                              order.customer.numero || ""
                            } — ${order.customer.bairro || ""}`
                          : ""}
                      </div>
                    </div>

                    <div className="mt-3 text-sm">
                      <div className="font-semibold">Itens</div>
                      <ul className="list-disc ml-5 text-xs text-gray-700">
                        {Array.isArray(order.items)
                          ? order.items.map((it, idx) => (
                              <li key={idx}>
                                {it.quantity || 1}x {it.name}{" "}
                                {it.toppings
                                  ? `(+${it.toppings.join(", ")})`
                                  : ""}
                              </li>
                            ))
                          : "—"}
                      </ul>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() =>
                          updateStatus(order.id, "preparando")
                        }
                        className="px-3 py-1 bg-amber-500 text-white rounded"
                      >
                        Preparando
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(order.id, "pronto")
                        }
                        className="px-3 py-1 bg-green-600 text-white rounded"
                      >
                        Pronto
                      </button>

                      <button
                        onClick={() =>
                          updateStatus(order.id, "entregue")
                        }
                        className="px-3 py-1 bg-gray-600 text-white rounded"
                      >
                        Entregue
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
