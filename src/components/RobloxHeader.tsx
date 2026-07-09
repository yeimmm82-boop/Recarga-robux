import React from "react";
import { Moon, Sun, ShieldAlert, LogOut, ShoppingBag, Search, Bell, Coins } from "lucide-react";
import { User } from "../firebase";

interface RobloxHeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeTab: "search" | "store" | "admin";
  setActiveTab: (tab: "search" | "store" | "admin") => void;
  user: User | null;
  onLogout: () => void;
  unreadCount: number;
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

function formatRobuxCompact(balanceStr: string): string {
  try {
    const bi = BigInt(balanceStr);
    if (bi >= 1_000_000_000_000_000_000n) {
      const integerPart = bi / 1_000_000_000_000_000_000n;
      const fractionPart = (bi % 1_000_000_000_000_000_000n) / 100_000_000_000_000_000n;
      return fractionPart > 0n ? `${integerPart}.${fractionPart}E` : `${integerPart}E`;
    }
    if (bi >= 1_000_000_000_000_000n) {
      const integerPart = bi / 1_000_000_000_000_000n;
      const fractionPart = (bi % 1_000_000_000_000_000n) / 100_000_000_000_000n;
      return fractionPart > 0n ? `${integerPart}.${fractionPart}Q` : `${integerPart}Q`;
    }
    if (bi >= 1_000_000_000_000n) {
      const integerPart = bi / 1_000_000_000_000n;
      const fractionPart = (bi % 1_000_000_000_000n) / 100_000_000_000n;
      return fractionPart > 0n ? `${integerPart}.${fractionPart}T` : `${integerPart}T`;
    }
    if (bi >= 1_000_000_000n) {
      const integerPart = bi / 1_000_000_000n;
      const fractionPart = (bi % 1_000_000_000n) / 100_000_000n;
      return fractionPart > 0n ? `${integerPart}.${fractionPart}B` : `${integerPart}B`;
    }
    if (bi >= 1_000_000n) {
      const integerPart = bi / 1_000_000n;
      const fractionPart = (bi % 1_000_000n) / 100_000n;
      return fractionPart > 0n ? `${integerPart}.${fractionPart}M` : `${integerPart}M`;
    }
    if (bi >= 1_000n) {
      const integerPart = bi / 1_000n;
      const fractionPart = (bi % 1_000n) / 100n;
      return fractionPart > 0n ? `${integerPart}.${fractionPart}K` : `${integerPart}K`;
    }
    return bi.toString();
  } catch (err) {
    return balanceStr;
  }
}

export default function RobloxHeader({
  darkMode,
  setDarkMode,
  activeTab,
  setActiveTab,
  user,
  onLogout,
  unreadCount,
  robuxBalance,
}: RobloxHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b transition-colors border-neutral-300 dark:border-neutral-800 bg-roblox-panel-light dark:bg-roblox-panel-dark text-neutral-800 dark:text-neutral-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Roblox Inspired Logo */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => setActiveTab("search")}
          id="header-logo-container"
        >
          <div className="relative w-8 h-8 bg-[#F1543F] roblox-skew-logo flex items-center justify-center rounded-sm shadow-md group-hover:scale-105 transition-transform duration-200">
            {/* The iconic inner square cut-out of Roblox logo */}
            <div className="w-2.5 h-2.5 bg-white dark:bg-roblox-panel-dark rounded-sm"></div>
          </div>
          <span className="font-bold text-xl tracking-wider font-sans text-neutral-900 dark:text-white flex items-center">
            BLOX<span className="text-roblox-blue hidden min-[400px]:inline">CONNECT</span>
            <span className="text-xs ml-1.5 px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded font-normal text-neutral-500 dark:text-neutral-400 hidden sm:inline">
              SIM
            </span>
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1" id="desktop-nav">
          <button
            id="nav-search-btn"
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
              activeTab === "search"
                ? "bg-roblox-blue text-white shadow-md shadow-blue-500/20"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            <Search className="w-4 h-4" />
            Buscar Usuarios
          </button>
          
          <button
            id="nav-store-btn"
            onClick={() => setActiveTab("store")}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
              activeTab === "store"
                ? "bg-roblox-blue text-white shadow-md shadow-blue-500/20"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Tienda Robux
          </button>

          <button
            id="nav-admin-btn"
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center gap-2 relative ${
              activeTab === "admin"
                ? "bg-roblox-blue text-white shadow-md shadow-blue-500/20"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Admin
            {user && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2" id="header-actions">
          {/* Robux Balance Indicator */}
          <div 
            onClick={() => setActiveTab("store")}
            className="flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 rounded-lg transition-all cursor-pointer active:scale-95 group shadow-sm"
            title={`Tu Saldo de Robux: ${formatRobux(robuxBalance)}`}
          >
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 animate-pulse group-hover:scale-110 transition-transform" />
            <span className="text-[11px] sm:text-xs font-black tracking-tight text-amber-600 dark:text-amber-400">
              <span className="hidden md:inline">{formatRobux(robuxBalance)}</span>
              <span className="inline md:hidden">{formatRobuxCompact(robuxBalance)}</span>
            </span>
          </div>

          {/* Unread Alert Indicator for logged-in admin */}
          {user && (
            <div className="relative p-2 text-neutral-600 dark:text-neutral-300 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer" onClick={() => setActiveTab("admin")}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-roblox-panel-light dark:border-roblox-panel-dark"></span>
              )}
            </div>
          )}

          {/* Dark Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-neutral-600 dark:text-neutral-300 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Admin Logged-In User Info & Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-300 dark:border-neutral-800">
              <span className="hidden lg:inline text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {user.email?.split("@")[0]}
              </span>
              <button
                id="header-logout-btn"
                onClick={onLogout}
                className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all active:scale-95 flex items-center justify-center"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="admin-shortcut-btn"
              onClick={() => setActiveTab("admin")}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span className="hidden sm:inline">Ingresar Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation bottom bar */}
      <div className="md:hidden flex border-t border-neutral-300 dark:border-neutral-800 bg-roblox-panel-light dark:bg-roblox-panel-dark py-2 justify-around" id="mobile-nav">
        <button
          id="mobile-nav-search-btn"
          onClick={() => setActiveTab("search")}
          className={`flex flex-col items-center space-y-0.5 text-[10px] font-medium transition-colors ${
            activeTab === "search" ? "text-roblox-blue" : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Buscar</span>
        </button>
        <button
          id="mobile-nav-store-btn"
          onClick={() => setActiveTab("store")}
          className={`flex flex-col items-center space-y-0.5 text-[10px] font-medium transition-colors ${
            activeTab === "store" ? "text-roblox-blue" : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Tienda</span>
        </button>
        <button
          id="mobile-nav-admin-btn"
          onClick={() => setActiveTab("admin")}
          className={`flex flex-col items-center space-y-0.5 text-[10px] font-medium transition-colors relative ${
            activeTab === "admin" ? "text-roblox-blue" : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          <ShieldAlert className="w-5 h-5" />
          <span>Admin</span>
          {user && unreadCount > 0 && (
            <span className="absolute top-0 right-3 bg-rose-500 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
