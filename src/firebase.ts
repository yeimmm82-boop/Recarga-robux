// Simulated Firebase layer with memory fallback to make the app 100% free, fully functional,
// and resilient to localStorage SecurityErrors/QuotaExceededErrors in iframes.

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyChange() {
  listeners.forEach((l) => l());
}

// Memory-backed storage fallback in case localStorage is disabled/insecure in the sandbox iframe
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      memoryStorage[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete memoryStorage[key];
    }
  }
};

// Mock structures to match Firebase Query and Doc Snapshots
class MockDocSnapshot {
  constructor(public id: string, private _data: any) {}
  data() {
    return this._data;
  }
}

class MockQuerySnapshot {
  docs: MockDocSnapshot[];
  size: number;
  constructor(docs: MockDocSnapshot[]) {
    this.docs = docs;
    this.size = docs.length;
  }
  forEach(callback: (doc: MockDocSnapshot) => void) {
    this.docs.forEach(callback);
  }
}

// Local Database Helpers
function getLocalData(collectionName: string): any[] {
  const raw = safeStorage.getItem(`mock_db_${collectionName}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Ignore parsing errors and reset to empty/seeded array below
    }
  }
  
  // Seed initial data if empty or corrupted
  if (collectionName === "notifications") {
    const initialNotifs = [
      {
        id: "notif_1",
        title: "Sistema Iniciado Localmente",
        message: "¡Bienvenido! El sistema de envío está operando de forma 100% gratuita y segura en LocalStorage o en memoria. No se requiere tarjeta de crédito ni cuentas externas.",
        type: "info",
        createdAt: new Date().toISOString(),
        read: false
      }
    ];
    safeStorage.setItem(`mock_db_notifications`, JSON.stringify(initialNotifs));
    return initialNotifs;
  }
  
  if (collectionName === "requests") {
    const initialRequests = [
      {
        id: "req_demo_1",
        userId: "48591234",
        username: "Builderman",
        displayName: "Builderman",
        avatarUrl: "https://images.rbxcdn.com/f11e96a40a83e6015b31df83df7d9b9d.png",
        robuxAmount: 1000000,
        status: "completed" as const,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        userNote: "Envío inicial para probar el sistema de transferencias.",
        type: "Direct Send"
      }
    ];
    safeStorage.setItem(`mock_db_requests`, JSON.stringify(initialRequests));
    return initialRequests;
  }
  
  return [];
}

function saveLocalData(collectionName: string, data: any[]) {
  const arrayData = Array.isArray(data) ? data : [];
  safeStorage.setItem(`mock_db_${collectionName}`, JSON.stringify(arrayData));
  notifyChange();
}

// Firebase Exports
export const db = { type: "firestore" };
export const auth = {
  currentUser: null as any
};

export type User = any;

export function collection(dbInstance: any, name: string) {
  return { type: "collection", name };
}

export function doc(dbInstance: any, collectionName: string, id?: string) {
  return { type: "doc", collectionName, id };
}

export function query(col: any, ...constraints: any[]) {
  return { type: "query", collectionName: col.name, constraints };
}

export function where(field: string, op: string, value: any) {
  return { type: "where", field, op, value };
}

export function orderBy(field: string, direction: "asc" | "desc" = "asc") {
  return { type: "orderBy", field, direction };
}

export function limit(num: number) {
  return { type: "limit", limit: num };
}

export const Timestamp = {
  now: () => new Date(),
  fromDate: (date: Date) => date
};

export function onSnapshot(
  queryObj: any,
  next: (snapshot: MockQuerySnapshot) => void,
  error?: (err: any) => void
) {
  const collectionName = queryObj.collectionName || queryObj.name;
  
  const trigger = () => {
    try {
      let items = getLocalData(collectionName);
      
      if (queryObj.constraints) {
        for (const constraint of queryObj.constraints) {
          if (constraint.type === "where") {
            const { field, op, value } = constraint;
            items = items.filter((item: any) => {
              if (op === "==") return item[field] === value;
              return true;
            });
          }
        }
        
        const orderConstraint = queryObj.constraints.find((c: any) => c.type === "orderBy");
        if (orderConstraint) {
          const { field, direction } = orderConstraint;
          items.sort((a: any, b: any) => {
            const valA = a[field];
            const valB = b[field];
            if (valA < valB) return direction === "asc" ? -1 : 1;
            if (valA > valB) return direction === "asc" ? 1 : -1;
            return 0;
          });
        } else {
          // Default order by createdAt desc
          items.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        }
        
        const limitConstraint = queryObj.constraints.find((c: any) => c.type === "limit");
        if (limitConstraint) {
          items = items.slice(0, limitConstraint.limit);
        }
      } else {
        items.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      }
      
      const snapshots = items.map((item: any) => new MockDocSnapshot(item.id, item));
      next(new MockQuerySnapshot(snapshots));
    } catch (err) {
      if (error) error(err);
    }
  };

  trigger();
  return subscribe(trigger);
}

export async function addDoc(colObj: any, data: any) {
  const collectionName = colObj.name;
  const items = getLocalData(collectionName);
  const newId = `${collectionName.slice(0, 3)}_${Math.random().toString(36).substring(2, 11)}`;
  const newItem = { id: newId, ...data };
  items.push(newItem);
  saveLocalData(collectionName, items);
  return { id: newId };
}

export async function updateDoc(docObj: any, data: any) {
  const collectionName = docObj.collectionName;
  const id = docObj.id;
  if (!collectionName || !id) return;
  
  const items = getLocalData(collectionName);
  if (!Array.isArray(items)) return;
  const index = items.findIndex((item) => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...data };
    saveLocalData(collectionName, items);
  }
}

export async function deleteDoc(docObj: any) {
  const collectionName = docObj.collectionName;
  const id = docObj.id;
  if (!collectionName || !id) return;
  
  let items = getLocalData(collectionName);
  if (!Array.isArray(items)) return;
  items = items.filter((item) => item.id !== id);
  saveLocalData(collectionName, items);
}

export async function getDocs(queryObj: any) {
  const collectionName = queryObj.collectionName || queryObj.name;
  const items = getLocalData(collectionName);
  const snapshots = items.map((item: any) => new MockDocSnapshot(item.id, item));
  return new MockQuerySnapshot(snapshots);
}

// Authentication Listeners and Mock Actions
let currentAuthListener: ((user: any) => void) | null = null;

export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  currentAuthListener = callback;
  
  const session = safeStorage.getItem("mock_admin_session");
  let userObj = null;
  if (session) {
    try {
      userObj = JSON.parse(session);
    } catch (e) {
      userObj = null;
    }
  }
  auth.currentUser = userObj;
  
  callback(userObj);
  
  return () => {
    currentAuthListener = null;
  };
}

export async function signInWithEmailAndPassword(authInstance: any, email: string, password: string) {
  let users: any[] = [];
  const rawUsers = safeStorage.getItem("mock_admin_users");
  if (rawUsers) {
    try {
      const parsed = JSON.parse(rawUsers);
      if (Array.isArray(parsed)) {
        users = parsed;
      }
    } catch (e) {
      users = [];
    }
  }
  
  const found = users.find((u: any) => u.email === email && u.password === password);
  
  if (!found && email === "admin@bloxconnect.com" && password === "admin123") {
    const defaultUser = { uid: "admin_uid_123", email, displayName: "Admin BloxConnect" };
    safeStorage.setItem("mock_admin_session", JSON.stringify(defaultUser));
    auth.currentUser = defaultUser;
    if (currentAuthListener) currentAuthListener(defaultUser);
    return { user: defaultUser };
  }
  
  if (!found) {
    const err = new Error("Credenciales incorrectas") as any;
    err.code = "auth/invalid-credential";
    throw err;
  }
  
  const loggedUser = { uid: found.uid, email: found.email, displayName: found.displayName || "Admin" };
  safeStorage.setItem("mock_admin_session", JSON.stringify(loggedUser));
  auth.currentUser = loggedUser;
  if (currentAuthListener) currentAuthListener(loggedUser);
  return { user: loggedUser };
}

export async function createUserWithEmailAndPassword(authInstance: any, email: string, password: string) {
  if (password.length < 6) {
    const err = new Error("La contraseña debe tener al menos 6 caracteres") as any;
    err.code = "auth/weak-password";
    throw err;
  }
  
  let users: any[] = [];
  const rawUsers = safeStorage.getItem("mock_admin_users");
  if (rawUsers) {
    try {
      const parsed = JSON.parse(rawUsers);
      if (Array.isArray(parsed)) {
        users = parsed;
      }
    } catch (e) {
      users = [];
    }
  }
  
  const exists = users.some((u: any) => u.email === email);
  if (exists || email === "admin@bloxconnect.com") {
    const err = new Error("El correo electrónico ya está en uso.") as any;
    err.code = "auth/email-already-in-use";
    throw err;
  }
  
  const newUser = { uid: `uid_${Math.random().toString(36).substring(2, 11)}`, email, password };
  users.push(newUser);
  safeStorage.setItem("mock_admin_users", JSON.stringify(users));
  
  const sessionUser = { uid: newUser.uid, email: newUser.email, displayName: "Admin" };
  safeStorage.setItem("mock_admin_session", JSON.stringify(sessionUser));
  auth.currentUser = sessionUser;
  if (currentAuthListener) currentAuthListener(sessionUser);
  return { user: sessionUser };
}

export async function signOut(authInstance: any) {
  safeStorage.removeItem("mock_admin_session");
  auth.currentUser = null;
  if (currentAuthListener) currentAuthListener(null);
}
