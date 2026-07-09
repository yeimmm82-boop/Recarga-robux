import React, { useState } from "react";
import { Search, Sparkles, CheckCircle2, ArrowRight, Loader2, Award, UserCheck } from "lucide-react";
import { RobloxUser } from "../types";
import { motion } from "motion/react";

interface UserSearchProps {
  onSelectUser: (user: RobloxUser) => void;
  searchedUsers: RobloxUser[];
  setSearchedUsers: (users: RobloxUser[]) => void;
}

export default function UserSearch({ onSelectUser, searchedUsers, setSearchedUsers }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setIsFallback(false);

    try {
      const res = await fetch(`/api/roblox/search?username=${encodeURIComponent(query.trim())}`);
      if (!res.ok) {
        throw new Error("No se pudo obtener resultados. Intenta de nuevo.");
      }
      const payload = await res.json();
      setSearchedUsers(payload.data || []);
      setIsFallback(!!payload.isFallback);
      if (payload.data && payload.data.length === 0) {
        setError("No se encontraron usuarios de Roblox con ese nombre.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con la API de Roblox. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="w-full space-y-8" id="user-search-module">
      {/* Search Hero Area */}
      <div className="bg-neutral-100 dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 md:p-8 text-center space-y-4 shadow-sm relative overflow-hidden">
        {/* Decorative background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-roblox-blue/10 text-roblox-blue text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Buscador Oficial Roblox API
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Busca cualquier Usuario de Roblox
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base">
            Ingresa un nombre de usuario real para consultar su perfil público, ID oficial, avatar 3D renderizado, y procesar el envío de Robux de forma segura sin requerir credenciales de Roblox.
          </p>

          <form onSubmit={handleSearch} className="pt-4 flex flex-col sm:flex-row gap-2 max-w-lg mx-auto" id="search-form">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
              <input
                id="search-input"
                type="text"
                placeholder="Nombre de usuario (ej. Roblox, Builderman)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-roblox-input-dark border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-roblox-blue focus:border-transparent transition-all shadow-inner text-sm"
              />
            </div>
            <button
              id="search-submit-btn"
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-roblox-blue hover:bg-roblox-blue-hover text-white font-semibold rounded-lg shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 text-sm disabled:opacity-75 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  Buscar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Error and Info panels */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg p-4 text-center text-sm font-medium">
          {error}
        </div>
      )}

      {isFallback && searchedUsers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg p-3.5 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-pulse text-amber-500 flex-shrink-0" />
          <span>Nota: Se han cargado resultados de búsqueda avanzada debido a límites o saturación de la API de Roblox.</span>
        </div>
      )}

      {/* Search results grid */}
      {searchedUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">
              Resultados de Búsqueda ({searchedUsers.length})
            </h3>
            <span className="text-xs text-neutral-400">Selecciona uno para mandar Robux</span>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            id="search-results-grid"
          >
            {searchedUsers.map((user) => (
              <motion.div
                key={user.id}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.15 } }}
                className="group bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 hover:border-roblox-blue dark:hover:border-roblox-blue rounded-xl p-3 flex flex-col justify-between items-center text-center shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Roblox Verified Badge */}
                {user.hasVerifiedBadge && (
                  <span className="absolute top-2 right-2 z-10 text-roblox-blue" title="Verificado por Roblox">
                    <CheckCircle2 className="w-4 h-4 fill-roblox-blue text-white" />
                  </span>
                )}

                {/* Avatar render container */}
                <div className="relative w-24 h-24 mb-3 rounded-lg bg-neutral-100 dark:bg-roblox-input-dark flex items-center justify-center overflow-hidden border border-neutral-100 dark:border-neutral-700">
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-contain group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-neutral-900/5 dark:bg-white/5 py-0.5 text-[8px] text-neutral-500 dark:text-neutral-400 font-mono">
                    ID: {user.id}
                  </div>
                </div>

                {/* Profile detail */}
                <div className="w-full space-y-0.5 mb-3 px-1">
                  <div className="font-bold text-xs truncate text-neutral-900 dark:text-white" title={user.displayName}>
                    {user.displayName}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate" title={`@${user.username}`}>
                    @{user.username}
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => onSelectUser(user)}
                  className="w-full py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-roblox-blue dark:hover:bg-roblox-blue text-neutral-700 dark:text-neutral-200 hover:text-white dark:hover:text-white rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Enviar Robux
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Suggested popular profiles if no search is active */}
      {searchedUsers.length === 0 && !loading && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-roblox-blue" />
            <h3 className="text-xs font-bold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">
              Perfiles Sugeridos Populares
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 1, username: "Roblox", displayName: "Roblox", avatarUrl: "https://images.rbxcdn.com/3932cfeb24b95eb83e6ffb548b111532.png", hasVerifiedBadge: true },
              { id: 2, username: "Builderman", displayName: "builderman", avatarUrl: "https://images.rbxcdn.com/f11e96a40a83e6015b31df83df7d9b9d.png", hasVerifiedBadge: true },
              { id: 125134, username: "DavidBaszucki", displayName: "david.baszucki", avatarUrl: "https://images.rbxcdn.com/7123ef6df5ab86e24b9d03c625ec1d2c.png", hasVerifiedBadge: true },
              { id: 4, username: "Linkmon99", displayName: "Linkmon99", avatarUrl: "https://images.rbxcdn.com/c102a0b4d40224b11f58df4d9d10e9f1.png", hasVerifiedBadge: true }
            ].map(suggested => (
              <div
                key={suggested.id}
                onClick={() => {
                  setQuery(suggested.username);
                  // Auto trigger search using the suggested user
                  setTimeout(() => {
                    document.getElementById("search-submit-btn")?.click();
                  }, 100);
                }}
                className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 flex items-center space-x-3 hover:border-roblox-blue dark:hover:border-roblox-blue cursor-pointer transition-all duration-150"
              >
                <div className="w-10 h-10 rounded bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-lg text-neutral-400">
                  R
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate flex items-center gap-1">
                    {suggested.displayName}
                    {suggested.hasVerifiedBadge && (
                      <CheckCircle2 className="w-3 h-3 fill-roblox-blue text-white inline flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate">@{suggested.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
