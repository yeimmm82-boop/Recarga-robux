import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Mail,
  Lock,
  Loader2,
  Trash2,
  Check,
  X,
  RefreshCw,
  TrendingUp,
  Coins,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Eye,
  CheckCircle,
  BellRing,
  UserPlus,
  LogIn,
  Sparkles
} from "lucide-react";
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  limit,
  User
} from "../firebase";
import { RobuxRequest, AlertNotification } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  user: any;
  unreadCount: number;
  onSimulatedLogin: (simUser: { email: string; uid: string; isSimulated: boolean }) => void;
  robuxBalance: string;
  onUpdateBalance: (newBalance: string) => void;
}

function formatRobux(balanceStr: string): string {
  try {
    const bi = BigInt(balanceStr);
    return bi.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  } catch (err) {
    return Number(balanceStr).toLocaleString("es-ES");
  }
}

export default function AdminPanel({
  user,
  unreadCount,
  onSimulatedLogin,
  robuxBalance,
  onUpdateBalance,
}: AdminPanelProps) {
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Robux Balance Editor State
  const [customBalanceInput, setCustomBalanceInput] = useState("");

  // Action Feedback and Dialog States
  const [panelError, setPanelError] = useState<string | null>(null);
  const [panelSuccess, setPanelSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Firestore Database State
  const [requests, setRequests] = useState<RobuxRequest[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSimulatedLogin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const simUser = {
      email: email || "admin@bloxconnect.com",
      uid: "sim_admin_12345",
      isSimulated: true
    };
    try {
      localStorage.setItem("simulated_admin", JSON.stringify(simUser));
    } catch (e) {}
    onSimulatedLogin(simUser);
  };

  // Handle Login / Sign Up
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Error de autenticación. Verifica tus credenciales.";
      if (err.code === "auth/invalid-credential") {
        errorMsg = "Credenciales incorrectas. Verifica tu correo y contraseña.";
      } else if (err.code === "auth/weak-password") {
        errorMsg = "La contraseña debe tener al menos 6 caracteres.";
      } else if (err.code === "auth/email-already-in-use") {
        errorMsg = "Este correo ya está registrado. Intenta iniciar sesión.";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMsg = "El proveedor de Email/Password no está habilitado en tu consola Firebase. Utiliza el botón de Bypass de Acceso para probar localmente.";
      }
      setAuthError(errorMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Real-time Firestore Sync
  useEffect(() => {
    if (!user) return;

    setDbLoading(true);

    // Sync requests
    const qRequests = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsubscribeRequests = onSnapshot(
      qRequests,
      (snapshot) => {
        const loadedRequests: RobuxRequest[] = [];
        snapshot.forEach((d) => {
          loadedRequests.push({ id: d.id, ...d.data() } as RobuxRequest);
        });
        setRequests(loadedRequests);
        setDbLoading(false);
      },
      (error) => {
        console.error("Firestore sync requests failed:", error);
        setDbLoading(false);
      }
    );

    // Sync notifications
    const qNotifications = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(20));
    const unsubscribeNotifications = onSnapshot(
      qNotifications,
      (snapshot) => {
        const loadedNotifications: AlertNotification[] = [];
        snapshot.forEach((d) => {
          loadedNotifications.push({ id: d.id, ...d.data() } as AlertNotification);
        });
        setNotifications(loadedNotifications);
      },
      (error) => {
        console.error("Firestore sync notifications failed:", error);
      }
    );

    return () => {
      unsubscribeRequests();
      unsubscribeNotifications();
    };
  }, [user]);

  enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

  // Firestore update request status
  const handleUpdateStatus = async (requestId: string, newStatus: "approved" | "rejected" | "completed") => {
    setPanelError(null);
    setPanelSuccess(null);
    try {
      const docRef = doc(db, "requests", requestId);
      await updateDoc(docRef, { status: newStatus });
      setPanelSuccess(`Solicitud actualizada con éxito a: ${newStatus}`);
      setTimeout(() => setPanelSuccess(null), 4000);
    } catch (error) {
      console.error("Failed to update status:", error);
      setPanelError("No se pudo actualizar el estado de la solicitud.");
      setTimeout(() => setPanelError(null), 4000);
      handleFirestoreError(error, OperationType.UPDATE, `requests/${requestId}`);
    }
  };

  // Delete request
  const handleDeleteRequest = async (requestId: string) => {
    setPanelError(null);
    setPanelSuccess(null);
    
    if (deleteConfirmId !== requestId) {
      setDeleteConfirmId(requestId);
      // Automatically clear confirmation after 4 seconds
      setTimeout(() => {
        setDeleteConfirmId((prev) => (prev === requestId ? null : prev));
      }, 4000);
      return;
    }

    try {
      await deleteDoc(doc(db, "requests", requestId));
      setDeleteConfirmId(null);
      setPanelSuccess("Registro eliminado del historial correctamente.");
      setTimeout(() => setPanelSuccess(null), 4000);
    } catch (error) {
      console.error("Failed to delete request:", error);
      setPanelError("No se pudo eliminar el registro de la base de datos.");
      setTimeout(() => setPanelError(null), 4000);
      handleFirestoreError(error, OperationType.DELETE, `requests/${requestId}`);
    }
  };

  // Mark notification as read
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notif of unreadNotifications) {
        await updateDoc(doc(db, "notifications", notif.id), { read: true });
      }
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  };

  // Calculate stats from real requests
  const totalRobuxSimulation = requests.reduce((sum, r) => sum + r.robuxAmount, 0);
  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;
  const completedRequestsCount = requests.filter((r) => r.status === "completed").length;
  const approvedRequestsCount = requests.filter((r) => r.status === "approved").length;

  // Filter requests based on status and search query
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    const matchesSearch =
      r.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userId.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  // Login/Registration View
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-8" id="admin-auth-module">
        <div className="bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-xl space-y-6 relative">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-roblox-blue rounded-t-2xl"></div>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-roblox-blue/10 text-roblox-blue rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-wider">
              Control de Administrador
            </h2>
            <p className="text-xs text-neutral-500">
              Inicia sesión o crea una cuenta administrativa para ver la base de datos de Cloud Firestore.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4" id="admin-auth-form">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="auth-email-input"
                  type="email"
                  placeholder="ej. admin@bloxconnect.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-roblox-input-dark border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-roblox-blue"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="auth-password-input"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-roblox-input-dark border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-roblox-blue"
                  required
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-roblox-blue hover:bg-roblox-blue-hover text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando...
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  Registrar Administrador
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Ingresar al Panel
                </>
              )}
            </button>
          </form>

          {/* Preset quick test helper */}
          <div className="p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg border text-center space-y-3">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
              ¿No tienes habilitado Email/Password en Firebase?
            </div>
            
            <button
              onClick={() => handleSimulatedLogin()}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black rounded-lg uppercase tracking-wider transition-all active:scale-98 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
              Bypass de Acceso (Acceso Local)
            </button>

            <div className="flex justify-center gap-4 text-xs font-semibold">
              <button
                onClick={() => {
                  setEmail("admin@bloxconnect.com");
                  setPassword("admin123");
                  setIsSignUp(false);
                }}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                Cargar Demo Admin
              </button>
              
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-roblox-blue font-bold hover:underline"
              >
                {isSignUp ? "Iniciar Sesión" : "Crear Nueva Cuenta"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loaded Admin Dashboard View
  return (
    <div className="w-full space-y-8" id="admin-dashboard-container">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-roblox-blue" />
            PANEL DE ADMINISTRACIÓN FIRESTORE
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Monitorea solicitudes en tiempo real desde Cloud Firestore, aprueba transacciones de Robux, y administra alertas del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded border font-mono">
            Firebase: Conectado ✓
          </span>
        </div>
      </div>

      {/* Inline Feedback Alerts */}
      <div className="space-y-2">
        {panelError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-lg flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{panelError}</span>
          </div>
        )}
        {panelSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-2.5 shadow-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{panelSuccess}</span>
          </div>
        )}
      </div>

      {/* Metric summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        <div className="bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Total Robux</span>
            <h4 className="text-2xl font-black text-neutral-900 dark:text-white">
              R$ {totalRobuxSimulation.toLocaleString()}
            </h4>
          </div>
          <div className="w-12 h-12 rounded-lg bg-roblox-gold/10 text-roblox-gold flex items-center justify-center">
            <Coins className="w-6 h-6 fill-roblox-gold" />
          </div>
        </div>

        <div className="bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Pendientes</span>
            <h4 className="text-2xl font-black text-yellow-500">
              {pendingRequestsCount}
            </h4>
          </div>
          <div className="w-12 h-12 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Aprobados</span>
            <h4 className="text-2xl font-black text-roblox-blue">
              {approvedRequestsCount}
            </h4>
          </div>
          <div className="w-12 h-12 rounded-lg bg-roblox-blue/10 text-roblox-blue flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest font-mono">Completados</span>
            <h4 className="text-2xl font-black text-emerald-500">
              {completedRequestsCount}
            </h4>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main interactive area: Request list & Notification alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left 2 cols: Requests Table */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
            
            {/* Table Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="font-bold text-md text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-neutral-500" />
                Historial de Solicitudes
              </h3>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filtrar por nombre o ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-neutral-50 dark:bg-roblox-input-dark border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-roblox-blue flex-1 sm:w-44 sm:flex-none"
                />

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-neutral-50 dark:bg-roblox-input-dark border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-roblox-blue"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                  <option value="completed">completed</option>
                </select>
              </div>
            </div>

            {dbLoading ? (
              <div className="py-12 text-center text-neutral-500 space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-roblox-blue" />
                <p className="text-xs">Sincronizando con Firestore en tiempo real...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-center text-neutral-500 space-y-1">
                <AlertCircle className="w-8 h-8 mx-auto text-neutral-400" />
                <p className="text-sm font-semibold">No se encontraron solicitudes.</p>
                <p className="text-xs">Los usuarios que busquen en la tienda y realicen envíos aparecerán aquí al instante.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs text-neutral-700 dark:text-neutral-300">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 text-[10px] font-bold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <th className="p-3">Destinatario</th>
                      <th className="p-3">Cantidad</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Acciones de Envío</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors"
                      >
                          {/* Destinatario Cell */}
                          <td className="p-3 flex items-center space-x-3">
                            <div className="w-9 h-9 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                              <img src={req.avatarUrl} alt={req.username} referrerPolicy="no-referrer" className="w-7 h-7 object-contain" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-neutral-900 dark:text-white truncate flex items-center gap-1">
                                {req.displayName}
                              </div>
                              <div className="text-[10px] text-neutral-500">@{req.username}</div>
                              {req.userNote && (
                                <div className="text-[9px] text-roblox-blue italic mt-0.5 truncate max-w-xs" title={req.userNote}>
                                  "{req.userNote}"
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Amount Cell */}
                          <td className="p-3">
                            <span className="font-black text-neutral-900 dark:text-white flex items-center gap-1">
                              <span className="text-roblox-gold font-bold">R$</span> {req.robuxAmount.toLocaleString()}
                            </span>
                          </td>

                          {/* CreatedAt Date Cell */}
                          <td className="p-3 text-neutral-500 whitespace-nowrap">
                            {new Date(req.createdAt).toLocaleString("es-ES", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>

                          {/* Status Cell */}
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                req.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                  : req.status === "approved"
                                  ? "bg-roblox-blue/10 text-roblox-blue border-roblox-blue/20"
                                  : req.status === "rejected"
                                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                  : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>

                          {/* Actions Cell */}
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Pending -> Approve / Reject */}
                              {req.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(req.id, "approved")}
                                    className="p-1.5 bg-roblox-blue hover:bg-roblox-blue-hover text-white rounded-md transition-all cursor-pointer"
                                    title="Aprobar Solicitud"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(req.id, "rejected")}
                                    className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-md transition-all cursor-pointer"
                                    title="Rechazar Solicitud"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {/* Approved -> Complete */}
                              {req.status === "approved" && (
                                <button
                                  onClick={() => handleUpdateStatus(req.id, "completed")}
                                  className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-bold text-[10px] uppercase transition-all flex items-center gap-1 cursor-pointer"
                                  title="Marcar como Completado"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Entregar
                                </button>
                              )}

                              {/* Delete always available for maintenance */}
                              <button
                                onClick={() => handleDeleteRequest(req.id)}
                                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  deleteConfirmId === req.id
                                    ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse"
                                    : "text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                }`}
                                title={deleteConfirmId === req.id ? "Haz clic de nuevo para confirmar eliminación" : "Eliminar Registro"}
                              >
                                {deleteConfirmId === req.id ? (
                                  <span>¡Confirmar!</span>
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 col: Live System Alerts / Notifications */}
        <div className="space-y-4">
          {/* Robux Balance Editor Widget */}
          <div className="bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
                Ajustar mi Saldo de Robux
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">Saldo Disponible:</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                  R$ {formatRobux(robuxBalance)}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-400 block">
                  Cantidad a Ajustar o Establecer
                </label>
                <input
                  type="text"
                  placeholder="Ej: 10000000"
                  value={customBalanceInput}
                  onChange={(e) => setCustomBalanceInput(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-roblox-input-dark border border-neutral-300 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-roblox-blue font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!customBalanceInput) return;
                    try {
                      const inputBig = BigInt(customBalanceInput);
                      const currentBig = BigInt(robuxBalance);
                      const nextBig = currentBig + inputBig;
                      onUpdateBalance(nextBig.toString());
                      setCustomBalanceInput("");
                    } catch (e) {
                      alert("Monto inválido");
                    }
                  }}
                  className="py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] font-black rounded-lg transition-colors cursor-pointer text-center"
                >
                  + Sumar Saldo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!customBalanceInput) return;
                    onUpdateBalance(customBalanceInput);
                    setCustomBalanceInput("");
                  }}
                  className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black rounded-lg transition-colors cursor-pointer text-center shadow-sm"
                >
                  Establecer Nuevo Saldo
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                <span className="text-[9px] uppercase font-bold text-neutral-400 block mb-1.5">Atajos de Saldo Rápido</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "1 Mil Millón", val: "1000000000" },
                    { label: "10B (Max)", val: "10000000000" },
                    { label: "100.000B", val: "100000000000" },
                    { label: "Establecer Millón", val: "1000000" }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        onUpdateBalance(preset.val);
                      }}
                      className="text-[9px] px-2 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 rounded text-neutral-600 dark:text-neutral-300 font-semibold cursor-pointer transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-roblox-panel-dark border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-roblox-blue" />
                Alertas del Sistema
              </h3>

              {notifications.filter(n => !n.read).length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-roblox-blue hover:underline cursor-pointer"
                >
                  Marcar todos
                </button>
              )}
            </div>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No hay alertas recientes en el sistema.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) handleMarkNotificationRead(notif.id);
                    }}
                    className={`p-3 rounded-lg border text-xs transition-all relative cursor-pointer ${
                      notif.read
                        ? "bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 text-neutral-500"
                        : "bg-roblox-blue/5 dark:bg-roblox-blue/10 border-roblox-blue/20 text-neutral-800 dark:text-neutral-100 shadow-sm"
                    }`}
                  >
                    {!notif.read && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-roblox-blue rounded-full"></span>
                    )}
                    <div className="font-bold mb-1">{notif.title}</div>
                    <p className="leading-relaxed mb-1.5">{notif.message}</p>
                    <span className="text-[9px] font-mono text-neutral-400">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick instructions block */}
          <div className="p-4 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
              Guía de Administración de Envío
            </h4>
            <ul className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Haz clic en un registro para auditar los datos transmitidos en tiempo real.</li>
              <li>Aprobar una solicitud la pasa de estado <strong>pending</strong> a <strong>approved</strong>.</li>
              <li>Al hacer clic en <strong>Entregar</strong>, se marca como <strong>completed</strong> (Confirmando la transferencia final exitosa).</li>
              <li>Toda modificación se sincroniza de inmediato con Firestore para todos los clientes activos.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
