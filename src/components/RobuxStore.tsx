import React, { useState } from "react";
import { ShoppingCart, CheckCircle, Search, AlertCircle, Coins, Sparkles, UserCheck, Loader2 } from "lucide-react";
import { RobloxUser, RobuxPackage, RobuxRequest } from "../types";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "motion/react";

interface RobuxStoreProps {
  selectedUser: RobloxUser | null;
  setSelectedUser: (user: RobloxUser | null) => void;
  onSuccess: (req: RobuxRequest) => void;
  robuxBalance: string;
}

function formatRobux(balanceStr: string): string {
  try {
    const bi = BigInt(balanceStr);
    return bi.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  } catch (err) {
    return Number(balanceStr).toLocaleString("es-ES");
  }
}

const ROBUX_PACKAGES: RobuxPackage[] = [
  { id: "p1", amount: 400, price: "$4.99", color: "from-emerald-500 to-teal-600", bonusText: "Ideal para Principiantes" },
  { id: "p2", amount: 800, price: "$9.99", color: "from-blue-500 to-indigo-600", isPopular: true, bonusText: "El Más Vendido" },
  { id: "p3", amount: 1700, price: "$19.99", color: "from-purple-500 to-pink-600", bonusText: "Mejor Valor" },
  { id: "p4", amount: 4500, price: "$49.99", color: "from-amber-500 to-orange-600", bonusText: "Super Pack Gamer" },
  { id: "p5", amount: 10000, price: "$99.99", color: "from-rose-500 to-red-600", bonusText: "Elite Streamer Pack" },
];

export default function RobuxStore({ selectedUser, setSelectedUser, onSuccess, robuxBalance }: RobuxStoreProps) {
  const [selectedPackage, setSelectedPackage] = useState<RobuxPackage | null>(ROBUX_PACKAGES[1]);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [userNote, setUserNote] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState("");
  const [quickSearchResults, setQuickSearchResults] = useState<RobloxUser[]>([]);
  const [quickSearchLoading, setQuickSearchLoading] = useState(false);
  const [successModal, setSuccessModal] = useState<RobuxRequest | null>(null);

  const isCustom = selectedPackage === null;
  const currentAmount = isCustom ? parseInt(customAmount) || 0 : selectedPackage.amount;

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearchQuery.trim()) return;

    setQuickSearchLoading(true);
    try {
      const res = await fetch(`/api/roblox/search?username=${encodeURIComponent(quickSearchQuery.trim())}`);
      if (res.ok) {
        const payload = await res.json();
        setQuickSearchResults(payload.data || []);
      }
    } catch (err) {
      console.error("Quick search failed:", err);
    } finally {
      setQuickSearchLoading(false);
    }
  };

  const handleSimulateSend = async () => {
    if (!selectedUser) return;
    if (currentAmount <= 0) return;

    // Verificar si tiene saldo suficiente
    try {
      if (BigInt(currentAmount) > BigInt(robuxBalance)) {
        alert("¡Error! Tu saldo disponible de Robux es insuficiente para realizar esta transacción.");
        return;
      }
    } catch (e) {
      if (currentAmount > Number(robuxBalance)) {
        alert("¡Error! Tu saldo disponible de Robux es insuficiente para realizar esta transacción.");
        return;
      }
    }

    setIsSending(true);

    try {
      const requestData = {
        userId: selectedUser.id.toString(),
        username: selectedUser.username,
        displayName: selectedUser.displayName,
        avatarUrl: selectedUser.avatarUrl,
        robuxAmount: currentAmount,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        userNote: userNote.trim(),
        type: "Direct Send",
      };

      // 1. Save request to Firestore
      const docRef = await addDoc(collection(db, "requests"), requestData);

      // 2. Create automatic notification in Firestore
      await addDoc(collection(db, "notifications"), {
        title: "Nueva Solicitud Recibida",
        message: `El usuario ${selectedUser.displayName} (@${selectedUser.username}) ha solicitado ${currentAmount.toLocaleString()} Robux.`,
        type: "info",
        createdAt: new Date().toISOString(),
        read: false,
      });

      const finalRequest: RobuxRequest = {
        id: docRef.id,
        ...requestData,
      };

      // Trigger success state
      setSuccessModal(finalRequest);
      onSuccess(finalRequest);

      // Reset Form State
      setCustomAmount("");
      setUserNote("");
    } catch (err) {
      console.error("Firestore submit error:", err);
      alert("Hubo un error guardando la solicitud en la base de datos.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8" id="robux-store-module">
      {/* Configuration & Send Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Step 1: Select Target User */}
        <div className="bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-roblox-blue text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
              Usuario de Destino
            </h3>
          </div>

          {selectedUser ? (
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="relative w-14 h-14 rounded-full bg-neutral-100 dark:bg-roblox-input-dark flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-neutral-700">
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.username}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-950 dark:text-white flex items-center gap-1">
                    {selectedUser.displayName}
                    {selectedUser.hasVerifiedBadge && (
                      <span className="inline-block w-3.5 h-3.5 bg-roblox-blue text-white rounded-full text-[8px] flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-neutral-500">@{selectedUser.username}</p>
                  <p className="text-[10px] text-neutral-400 font-mono">User ID: {selectedUser.id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-xs font-semibold text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Debes seleccionar un usuario para poder procesar el envío de Robux. Búscalo a continuación o usa la pestaña superior.
                </span>
              </div>

              {/* Mini Quick Search */}
              <form onSubmit={handleQuickSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar usuario rápido (ej. Builderman)"
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-roblox-input-dark border border-neutral-300 dark:border-neutral-700 rounded-md text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-roblox-blue"
                />
                <button
                  type="submit"
                  disabled={quickSearchLoading}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {quickSearchLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Buscar
                </button>
              </form>

              {quickSearchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {quickSearchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="p-2 border border-neutral-200 dark:border-neutral-800 hover:border-roblox-blue dark:hover:border-roblox-blue bg-neutral-50 dark:bg-neutral-900 rounded-lg flex items-center gap-3 cursor-pointer transition-all"
                    >
                      <div className="w-10 h-10 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={user.avatarUrl} alt={user.username} referrerPolicy="no-referrer" className="w-8 h-8 object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate">{user.displayName}</div>
                        <div className="text-[10px] text-neutral-500 truncate">@{user.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Choose Robux Package */}
        <div className="bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-roblox-blue text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                Selecciona la Cantidad de Robux
              </h3>
            </div>
            
            <button
              onClick={() => setSelectedPackage(null)}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                isCustom
                  ? "bg-roblox-blue text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
              }`}
            >
              Monto Personalizado
            </button>
          </div>

          {!isCustom ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" id="packages-grid">
              {ROBUX_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedPackage?.id === pkg.id
                      ? "border-roblox-blue bg-roblox-blue/5 dark:bg-roblox-blue/10 shadow-md ring-1 ring-roblox-blue"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30"
                  }`}
                >
                  {pkg.isPopular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-roblox-blue text-white text-[9px] font-bold uppercase rounded-full tracking-wider">
                      Popular
                    </span>
                  )}
                  
                  <div className="flex flex-col items-center text-center space-y-2">
                    {/* Simulated Robux Gold Hexagon Coin */}
                    <div className="w-12 h-12 bg-roblox-gold rounded-xl flex items-center justify-center text-neutral-950 font-black text-xl shadow-md select-none rotate-12 transform hover:rotate-0 transition-transform">
                      R$
                    </div>
                    
                    <div className="space-y-0.5">
                      <div className="font-black text-lg text-neutral-900 dark:text-white">
                        {pkg.amount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-semibold">
                        Robux
                      </div>
                    </div>

                    <div className="text-xs px-2.5 py-1 bg-neutral-200/50 dark:bg-neutral-800 rounded-md font-bold text-neutral-800 dark:text-neutral-200">
                      {pkg.price}
                    </div>

                    {pkg.bonusText && (
                      <span className="text-[9px] text-neutral-400">{pkg.bonusText}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest">
                Ingresa Monto Personalizado (Robux)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-roblox-gold text-lg">
                  R$
                </span>
                <input
                  type="number"
                  placeholder="Ej. 25000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min="1"
                  max="10000000"
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-roblox-input-dark border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-roblox-blue"
                />
              </div>
              <p className="text-[10px] text-neutral-400">
                Puedes enviar cualquier cantidad desde 1 hasta 10,000,000 Robux.
              </p>
            </div>
          )}
        </div>

        {/* Step 3: Add Note and Submit */}
        <div className="bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-roblox-blue text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
              Nota del Donante (Opcional)
            </h3>
          </div>

          <textarea
            rows={3}
            placeholder="Escribe un mensaje para esta transacción... (ej. ¡Gracias por jugar mi juego!)"
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            className="w-full p-3 bg-neutral-50 dark:bg-roblox-input-dark border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-roblox-blue transition-all"
          />

          <button
            id="simulate-send-action-btn"
            onClick={handleSimulateSend}
            disabled={isSending || !selectedUser || currentAmount <= 0}
            className="w-full py-4 bg-roblox-blue hover:bg-roblox-blue-hover disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white font-black rounded-xl text-md shadow-lg shadow-blue-500/10 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando en Firestore...
              </>
            ) : (
              <>
                <Coins className="w-5 h-5 text-roblox-gold fill-roblox-gold" />
                ENVIAR {currentAmount.toLocaleString()} ROBUX
              </>
            )}
          </button>
        </div>
      </div>

      {/* Roblox Style Receipt Sidebar */}
      <div className="space-y-6">
        {/* Mi Saldo de Robux Card */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-500/30 dark:border-amber-500/20 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center text-white font-black text-sm rotate-12 shadow-md shrink-0">
              R$
            </div>
            <div>
              <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                Mi Saldo de Robux
              </h4>
              <p className="text-lg font-black text-neutral-900 dark:text-white tracking-tight font-mono">
                {formatRobux(robuxBalance)}
              </p>
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 italic">
            El saldo se descontará automáticamente en tiempo real después de cada envío de Robux.
          </div>
        </div>

        <div className="bg-neutral-100 dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm sticky top-24 space-y-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b pb-3 border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span>Resumen de Envío</span>
            <ShoppingCart className="w-4 h-4 text-neutral-400" />
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Destinatario</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">
                {selectedUser ? `@${selectedUser.username}` : "No seleccionado"}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Tipo de Envío</span>
              <span className="font-medium text-roblox-blue">Envío Directo</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Valor de Mercado</span>
              <span className="font-medium text-neutral-600 dark:text-neutral-400">
                {isCustom ? `$${((parseInt(customAmount) || 0) * 0.0125).toFixed(2)} USD` : selectedPackage?.price}
              </span>
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4 flex justify-between items-end">
              <span className="text-xs font-bold text-neutral-500 uppercase">Total Robux</span>
              <div className="text-right">
                <span className="text-2xl font-black text-neutral-900 dark:text-white">
                  R$ {currentAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-200/50 dark:bg-neutral-800 rounded-lg text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1">
            <div className="font-bold text-neutral-600 dark:text-neutral-300">¿Cómo funciona el envío?</div>
            <p>
              Esta aplicación guarda la solicitud en Cloud Firestore de manera segura. Los administradores pueden verla, aprobarla y gestionarla en tiempo real para optimizar la distribución de forma segura.
            </p>
          </div>
        </div>
      </div>

      {/* Confetti / Success Modal */}
      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-roblox-panel-dark border border-neutral-300 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 text-center space-y-6 shadow-2xl relative overflow-hidden"
              id="success-simulation-modal"
            >
              {/* Confetti decorations */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-roblox-gold via-roblox-blue to-emerald-400"></div>

              <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-bold text-neutral-900 dark:text-white">
                  ¡Transacción Enviada con Éxito!
                </h4>
                <p className="text-xs text-neutral-500 px-4">
                  Ha sido enviado con éxito en tiempo real
                </p>
              </div>

              {/* Receipt card */}
              <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 text-left font-sans space-y-3.5">
                <div className="flex items-center space-x-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <div className="w-10 h-10 rounded bg-white dark:bg-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img src={successModal.avatarUrl} alt={successModal.username} referrerPolicy="no-referrer" className="w-8 h-8 object-contain" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">{successModal.displayName}</div>
                    <div className="text-[10px] text-neutral-500">@{successModal.username}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-neutral-500">Cantidad:</span>
                  <span className="font-bold text-right text-neutral-900 dark:text-white">
                    R$ {successModal.robuxAmount.toLocaleString()}
                  </span>

                  <span className="text-neutral-500">Estado:</span>
                  <span className="text-right text-yellow-500 font-bold uppercase text-[10px] tracking-wider">
                    {successModal.status}
                  </span>

                  <span className="text-neutral-500">Transacción ID:</span>
                  <span className="text-right text-[10px] font-mono text-neutral-400 truncate pl-4" title={successModal.id}>
                    {successModal.id}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSuccessModal(null)}
                className="w-full py-2.5 bg-roblox-blue hover:bg-roblox-blue-hover text-white font-bold rounded-lg text-sm transition-colors cursor-pointer"
              >
                Cerrar Recibo
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
