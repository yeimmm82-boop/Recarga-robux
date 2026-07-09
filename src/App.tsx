import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import RobloxHeader from "./components/RobloxHeader";
import UserSearch from "./components/UserSearch";
import RobuxStore from "./components/RobuxStore";
import AdminPanel from "./components/AdminPanel";
import { RobloxUser, RobuxRequest, AlertNotification } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, Coins, HelpCircle, Heart } from "lucide-react";

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  const [activeTab, setActiveTab] = useState<"search" | "store" | "admin">("search");
  const [selectedUser, setSelectedUser] = useState<RobloxUser | null>(null);
  const [searchedUsers, setSearchedUsers] = useState<RobloxUser[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [alertText, setAlertText] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [robuxBalance, setRobuxBalance] = useState<string>(() => {
    return localStorage.getItem("my_robux_balance") || "100000000000000000";
  });

  const handleDeductRobux = (amount: number) => {
    setRobuxBalance((prev) => {
      try {
        const currentBig = BigInt(prev);
        const subBig = BigInt(amount);
        const nextBig = currentBig - subBig;
        const nextStr = nextBig < 0n ? "0" : nextBig.toString();
        localStorage.setItem("my_robux_balance", nextStr);
        return nextStr;
      } catch (err) {
        const nextNum = Math.max(0, Number(prev) - amount);
        const nextStr = Math.floor(nextNum).toString();
        localStorage.setItem("my_robux_balance", nextStr);
        return nextStr;
      }
    });
  };

  // Apply dark class to document element on mount and state change
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Auth observer
  useEffect(() => {
    const savedSimulated = localStorage.getItem("simulated_admin");
    if (savedSimulated) {
      setUser(JSON.parse(savedSimulated));
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.removeItem("simulated_admin"); // Clear simulated user if a real one logs in
      } else if (!localStorage.getItem("simulated_admin")) {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for unread system notifications in real-time if an admin is logged in
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const q = query(collection(db, "notifications"), where("read", "==", false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      if (user?.isSimulated) {
        setUser(null);
        localStorage.removeItem("simulated_admin");
      } else {
        await signOut(auth);
      }
      setAlertText({ message: "Sesión cerrada correctamente", type: "info" });
      setTimeout(() => setAlertText(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectUserForRobux = (target: RobloxUser) => {
    setSelectedUser(target);
    setActiveTab("store");
    setAlertText({ message: `Usuario @${target.username} seleccionado para mandar Robux`, type: "success" });
    setTimeout(() => setAlertText(null), 3500);
  };

  const handleRobuxSendSuccess = (req: RobuxRequest) => {
    setAlertText({ message: `¡Solicitud de R$ ${req.robuxAmount.toLocaleString()} enviada con éxito!`, type: "success" });
    setTimeout(() => setAlertText(null), 4000);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-roblox-bg-light dark:bg-roblox-bg-dark text-neutral-800 dark:text-neutral-100 flex flex-col font-sans selection:bg-roblox-blue/20 selection:text-roblox-blue">
      {/* Header element */}
      <RobloxHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        unreadCount={unreadCount}
        robuxBalance={robuxBalance}
      />

      {/* Real-time Toast Notifications */}
      <AnimatePresence>
        {alertText && (
          <div className="fixed bottom-5 right-5 z-50 max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className={`p-4 rounded-xl border shadow-xl flex items-center space-x-3 backdrop-blur-md ${
                alertText.type === "success"
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-roblox-blue/10 dark:bg-roblox-blue/20 border-roblox-blue/30 text-roblox-blue dark:text-blue-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  alertText.type === "success" ? "bg-emerald-500 text-white" : "bg-roblox-blue text-white"
                }`}
              >
                <Coins className="w-4 h-4 fill-current" />
              </div>
              <div className="text-xs font-bold leading-snug">{alertText.message}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="w-full"
          >
            {activeTab === "search" && (
              <UserSearch
                onSelectUser={handleSelectUserForRobux}
                searchedUsers={searchedUsers}
                setSearchedUsers={setSearchedUsers}
              />
            )}

            {activeTab === "store" && (
              <RobuxStore
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
                onSuccess={(req) => {
                  handleDeductRobux(req.robuxAmount);
                  handleRobuxSendSuccess(req);
                }}
                robuxBalance={robuxBalance}
              />
            )}

            {activeTab === "admin" && (
              <AdminPanel
                user={user}
                unreadCount={unreadCount}
                onSimulatedLogin={(simUser) => setUser(simUser)}
                robuxBalance={robuxBalance}
                onUpdateBalance={(newBalance) => {
                  setRobuxBalance(newBalance);
                  localStorage.setItem("my_robux_balance", newBalance);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Roblox-Inspired Footer */}
      <footer className="w-full bg-white dark:bg-roblox-panel-dark border-t border-neutral-200 dark:border-neutral-800 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500 dark:text-neutral-400">
          
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-roblox-blue roblox-skew-logo flex items-center justify-center rounded-sm">
              <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
            </div>
            <span className="font-bold tracking-wider text-neutral-800 dark:text-neutral-300">
              BLOXCONNECT © {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="hover:underline cursor-pointer">Términos de Servicio</span>
            <span className="hover:underline cursor-pointer">Política de Privacidad</span>
            <span className="hover:underline cursor-pointer flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Ayuda y Soporte
            </span>
          </div>

          <div className="flex items-center gap-1 font-medium">
            Hecho con <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" /> para fanáticos de Roblox
          </div>

        </div>
        <div className="max-w-2xl mx-auto text-center mt-6 text-[10px] text-neutral-400 dark:text-neutral-500 px-4">
          Aviso Legal: Esta aplicación es una herramienta de envío interactiva con fines educativos y de entretenimiento. No está afiliada ni patrocinada por Roblox Corporation. No transfiere Robux reales ni requiere credenciales de cuentas de Roblox.
        </div>
      </footer>
    </div>
  );
}
