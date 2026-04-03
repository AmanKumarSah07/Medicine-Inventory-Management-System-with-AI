// App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIDashboard from "./components/AIDashboard.jsx";
/*
Medical Inventory System (single-file)
- Tailwind UI + framer-motion
- Single App.jsx
- Seed users include Aman (admin) with password 12345678
- Admin can add/remove users (and view logs)
- Inventory manager can add/remove medicines, approve reorders (and view logs)
- Doctors request medicines -> dispensed instantly if available; otherwise trigger auto-reorder
- Auto-reorder integrates with OpenFDA (free) to fetch details (best-effort). Suggestion goes to Inventory panel for approval.
- Local state persisted to localStorage
*/

/* ---------- Local storage helpers ---------- */
const LS_KEY = "mis_app_v3";
const saveLS = (state) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
};
const loadLS = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

/* ---------- Seed data ---------- */
const seed = {
  users: [
    { id: 1, name: "Aman", role: "admin", password: "12345678" }, // admin
    { id: 2, name: "Ben", role: "inventory", password: "1234" },   // inventory manager
    { id: 3, name: "Chloe", role: "doctor", password: "1234" },   // doctor
    { id: 4, name: "SupplyBot", role: "supplier", password: "1234" }, // supplier
  ],
  medicines: [
    { id: 1, name: "Paracetamol 500mg", quantity: 120, expiry: "2026-01-01", reorderLevel: 50 },
    { id: 2, name: "Ibuprofen 200mg", quantity: 60, expiry: "2025-06-15", reorderLevel: 40 },
    { id: 3, name: "Amoxicillin 250mg", quantity: 15, expiry: "2025-01-10", reorderLevel: 30 },
  ],
  suppliers: [
    { id: 1, name: "MediSupply Co.", contact: "medisupply@example.com", phone: "+1 555-555-1212" },
  ],
  orders: [],      // purchase orders created when reorders approved
  requests: [],    // doctor requests (some dispensed, some pending)
  reorders: [],    // reorder suggestions awaiting inventory approval
  logs: [],        // activity log
};

/* ---------- small helpers ---------- */
const uid = () => Math.floor(Math.random() * 1e9);
const todayStr = () => new Date().toISOString().slice(0, 10);
const isExpired = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

/* ---------- UI primitives ---------- */
function Card({ title, actions, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex gap-2">{actions}</div>
      </div>
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "solid", className = "", disabled = false }) {
  const base = "px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    solid: "bg-blue-600 text-white hover:bg-blue-700",
    soft: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    ghost: "text-blue-700 hover:bg-blue-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    green: "bg-emerald-600 text-white hover:bg-emerald-700",
    amber: "bg-amber-500 text-white hover:bg-amber-600",
  };
  return (
    <button className={`${base} ${styles[variant] || styles.solid} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder = "", type = "text", className = "" }) {
  return (
    <input
      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
    />
  );
}

function Select({ value, onChange, options, className = "" }) {
  return (
    <select className={`w-full rounded-xl border px-3 py-2 text-sm ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Table({ columns, data, empty = "No records." }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-600">
            {columns.map((c) => <th key={c.key} className="border-b bg-slate-50 p-2 font-semibold">{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="p-4 text-center text-slate-500">{empty}</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="border-b hover:bg-slate-50">
                {columns.map((c) => <td key={c.key} className="p-2 align-top">{c.cell ? c.cell(row) : row[c.key]}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- App component ---------- */
export default function App() {
  const persisted = loadLS();
  const [state, setState] = useState(persisted || seed);
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => saveLS(state), [state]);

  // push a log entry
  const pushLog = (text) => {
    const entry = { id: uid(), time: new Date().toLocaleString(), text };
    setState((s) => ({ ...s, logs: [entry, ...s.logs].slice(0, 300) }));
  };

  // Authentication: require password, Aman must use 12345678; other seeded users require password too
  const handleLogin = (username, password, role) => {
    setAuthError("");
    const user = state.users.find((u) => u.name.toLowerCase() === username.trim().toLowerCase() && u.role === role);
    if (!user) {
      setAuthError("User not found with that role.");
      return false;
    }
    // require password to match
    if (!user.password) {
      setAuthError("This user has no password set (seed data expects password).");
      return false;
    }
    if (user.password !== password) {
      setAuthError("Incorrect password.");
      return false;
    }
    setCurrentUser({ id: user.id, name: user.name, role: user.role });
    pushLog(`${user.name} logged in as ${user.role}`);
    return true;
  };

  const handleLogout = () => {
    if (currentUser) pushLog(`${currentUser.name} logged out`);
    setCurrentUser(null);
  };

  // admin adds/removes user
  const addUser = (newUser) => {
    setState((s) => ({ ...s, users: [{ id: uid(), ...newUser }, ...s.users] }));
    pushLog(`Admin added user ${newUser.name} (${newUser.role})`);
  };
  const removeUser = (id) => {
    const u = state.users.find((x) => x.id === id);
    setState((s) => ({ ...s, users: s.users.filter((x) => x.id !== id) }));
    pushLog(`Admin removed user ${u?.name || id}`);
  };

  // inventory: add/remove medicines
  const addMedicine = (m) => {
    setState((s) => ({ ...s, medicines: [{ id: uid(), ...m }, ...s.medicines] }));
    pushLog(`Inventory added medicine ${m.name} (${m.quantity})`);
  };
  const removeMedicine = (id) => {
    const m = state.medicines.find((x) => x.id === id);
    setState((s) => ({ ...s, medicines: s.medicines.filter((x) => x.id !== id) }));
    pushLog(`Inventory removed medicine ${m?.name || id}`);
  };

  // doctor requests medicine
  const doctorRequest = async ({ medicineId, qty, requester }) => {
    const med = state.medicines.find((m) => m.id === Number(medicineId));
    if (!med) return { ok: false, message: "Medicine not found" };

    // if available -> dispense immediately
    if (med.quantity >= qty) {
      setState((s) => ({
        ...s,
        medicines: s.medicines.map((m) => (m.id === med.id ? { ...m, quantity: m.quantity - qty } : m)),
        requests: [{ id: uid(), medicineId: med.id, medicine: med.name, qty, requester, status: "Dispensed", time: new Date().toLocaleString() }, ...s.requests],
      }));
      pushLog(`${requester} requested ${qty} x ${med.name} → Dispensed instantly`);
      return { ok: true, dispensed: true };
    }

    // not enough: create request + call OpenFDA to fetch details for reorder suggestion
    const request = { id: uid(), medicineId: med.id, medicine: med.name, qty, requester, status: "Pending", time: new Date().toLocaleString() };
    setState((s) => ({ ...s, requests: [request, ...s.requests] }));
    pushLog(`${requester} requested ${qty} x ${med.name} → Not enough stock (request created)`);

    // Call OpenFDA (best-effort). If it fails, still create a local suggestion
    // Note: OpenFDA search may not find all brand/generic names. This is a best-effort integration.
    try {
      const queryName = encodeURIComponent(med.name.split(" ")[0]); // simple: use first token
      const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${queryName}&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // data.results[0] may exist
        const suggestedQty = Math.max(qty, med.reorderLevel * 2);
        const suggestion = {
          id: uid(),
          medicineId: med.id,
          medicine: med.name,
          qty: suggestedQty,
          meta: data.results ? data.results[0] : null,
          status: "Pending Approval",
          createdAt: new Date().toLocaleString(),
        };
        setState((s) => ({ ...s, reorders: [suggestion, ...s.reorders] }));
        pushLog(`Auto-reorder suggestion created for ${med.name} (qty: ${suggestion.qty})`);
        return { ok: true, dispensed: false };
      } else {
        // API error -> fallback suggestion
        const suggestedQty = Math.max(qty, med.reorderLevel * 2);
        const suggestion = { id: uid(), medicineId: med.id, medicine: med.name, qty: suggestedQty, meta: null, status: "Pending Approval", createdAt: new Date().toLocaleString() };
        setState((s) => ({ ...s, reorders: [suggestion, ...s.reorders] }));
        pushLog(`Auto-reorder suggestion (fallback) created for ${med.name}`);
        return { ok: true, dispensed: false };
      }
    } catch (err) {
      const suggestedQty = Math.max(qty, med.reorderLevel * 2);
      const suggestion = { id: uid(), medicineId: med.id, medicine: med.name, qty: suggestedQty, meta: null, status: "Pending Approval", createdAt: new Date().toLocaleString() };
      setState((s) => ({ ...s, reorders: [suggestion, ...s.reorders] }));
      pushLog(`Auto-reorder suggestion (error path) created for ${med.name}`);
      return { ok: true, dispensed: false };
    }
  };

  // inventory approves reorder -> creates an order for supplier
  const approveReorder = (reorderId) => {
    const r = state.reorders.find((x) => x.id === reorderId);
    if (!r) return;
    // create a purchase order (status Pending)
    const order = { id: uid(), medicineId: r.medicineId, medicine: r.medicine, qty: r.qty, supplierId: state.suppliers[0]?.id || null, status: "Pending", createdAt: new Date().toLocaleString() };
    setState((s) => ({ ...s, orders: [order, ...s.orders], reorders: s.reorders.filter((x) => x.id !== reorderId) }));
    pushLog(`Inventory approved reorder for ${r.medicine} -> Order #${order.id}`);
  };

  // supplier updates order status; when delivered -> increment stock
  const updateOrderStatus = (orderId, status) => {
    const ord = state.orders.find((o) => o.id === orderId);
    if (!ord) return;
    setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) }));
    pushLog(`Order #${orderId} status changed to ${status}`);
    if (status === "Delivered") {
      // increase stock
      setState((s) => ({ ...s, medicines: s.medicines.map((m) => (m.id === ord.medicineId ? { ...m, quantity: m.quantity + ord.qty } : m)) }));
      pushLog(`Order #${orderId} received: +${ord.qty} ${ord.medicine}`);
    }
  };

  /* ---------- conditional UI ---------- */
  return (
    <div className="min-h-screen bg-slate-100">
      <TopNav user={currentUser} onLogout={handleLogout} />
      <main className="mx-auto max-w-7xl p-6">
        <AnimatePresence mode="wait">
          {!currentUser ? (
            <motion.div key="login" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <LoginScreen onLogin={handleLogin} authError={authError} users={state.users} />
            </motion.div>
          ) : (
            <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard
                state={state}
                currentUser={currentUser}
                addUser={addUser}
                removeUser={removeUser}
                addMedicine={addMedicine}
                removeMedicine={removeMedicine}
                doctorRequest={doctorRequest}
                approveReorder={approveReorder}
                updateOrderStatus={updateOrderStatus}
                pushLog={pushLog}
                setState={setState}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ---------- Top navigation ---------- */
function TopNav({ user, onLogout }) {
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600 grid place-content-center text-white font-bold">MI</div>
          <div>
            <div className="font-semibold">Medical Inventory</div>
            <div className="text-xs text-slate-500">Use-case driven frontend</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-slate-600">{user.name} • {prettyRole(user.role)}</span>
              <Button variant="ghost" onClick={onLogout}>Logout</Button>
            </>
          ) : (
            <span className="text-sm text-slate-500">Please sign in</span>
          )}
        </div>
      </div>
    </div>
  );
}

const prettyRole = (r) => ({ admin: "Admin", inventory: "Inventory Manager", doctor: "Doctor/Nurse", supplier: "Supplier" }[r] || r);

/* ---------- Login screen ---------- */
function LoginScreen({ onLogin, authError, users }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("doctor");
  const [password, setPassword] = useState("");

  // Quick-fill from seeded users
  const quickUsers = users.slice(0, 4);

  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <div className="order-2 md:order-1">
        <Card title="Sign in">
          <div className="grid gap-4">
            {authError && <div className="text-sm text-rose-600">{authError}</div>}
            <div>
              <label className="text-xs text-slate-600">Username</label>
              <Input value={name} onChange={setName} placeholder="Your username (e.g. Aman)" />
            </div>
            <div>
              <label className="text-xs text-slate-600">Role</label>
              <Select value={role} onChange={setRole} options={[
                { value: "admin", label: "Admin" },
                { value: "inventory", label: "Inventory Manager" },
                { value: "doctor", label: "Doctor/Nurse" },
                { value: "supplier", label: "Supplier" },
              ]} />
            </div>
            {role === "admin" || role === "inventory" || role === "supplier" || role === "doctor" ? (
              <div>
                <label className="text-xs text-slate-600">Password</label>
                <Input type="password" value={password} onChange={setPassword} placeholder="Password" />
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button onClick={() => onLogin(name.trim(), password, role)}>Login</Button>
            </div>

            <div className="text-xs text-slate-500">Quick users:</div>
            <div className="flex flex-wrap gap-2">
              {quickUsers.map((u) => (
                <Button key={u.id} variant="soft" onClick={() => { setName(u.name); setRole(u.role); setPassword(u.password || ""); }}>
                  {u.name} ({prettyRole(u.role)})
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="order-1 md:order-2">
        <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-br from-blue-600 to-emerald-500 text-white rounded-3xl p-8 shadow-lg">
          <div className="text-3xl font-bold mb-2">Welcome</div>
          <p className="opacity-90">Role-based demo. Aman is admin (password 12345678). Doctors get instant dispensing when stock exists. If stock is low, a reorder suggestion is created and sent to Inventory panel.</p>
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Dashboard (role routing) ---------- */
function Dashboard({ state, currentUser, addUser, removeUser, addMedicine, removeMedicine, doctorRequest, approveReorder, updateOrderStatus, pushLog, setState }) {
  const role = currentUser.role;
  const [viewAI, setViewAI] = useState(false);

  return (
    <div className="grid gap-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
        <h2 className="text-xl font-bold">Workspace: {role === "admin" ? "Admin" : role === "inventory" ? "Inventory Manager" : role === "doctor" ? "Doctor/Nurse" : "Supplier"}</h2>
        {role !== "supplier" && (
          <button 
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${viewAI ? 'bg-purple-600 text-white shadow-lg' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
            onClick={() => setViewAI(!viewAI)}
          >
            {viewAI ? "Close AI Dashboard" : "✨ Enter AI Dashboard"}
          </button>
        )}
      </div>

      {!viewAI && (
        <div className="grid md:grid-cols-4 gap-4">
        <Stat title="Total Medicines" value={state.medicines.length} />
        <Stat title="Low Stock" value={state.medicines.filter((m) => m.quantity <= m.reorderLevel).length} tone="amber" />
        <Stat title="Open Orders" value={state.orders.filter((o) => o.status !== "Delivered").length} tone="blue" />
        <Stat title="Pending Reorders" value={state.reorders.length} tone="emerald" />
      </div>
      )}

      {!viewAI && role === "admin" && <AdminPanel state={state} addUser={addUser} removeUser={removeUser} pushLog={pushLog} />}
      {!viewAI && role === "inventory" && <InventoryPanel state={state} addMedicine={addMedicine} removeMedicine={removeMedicine} approveReorder={approveReorder} updateOrderStatus={updateOrderStatus} pushLog={pushLog} />}
      {!viewAI && role === "doctor" && <DoctorPanel state={state} doctorRequest={doctorRequest} />}
      {!viewAI && role === "supplier" && <SupplierPanel state={state} updateOrderStatus={updateOrderStatus} />}

      {/* AI Dashboard Section */}
      {viewAI && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <AIDashboard state={state} pushLog={pushLog} addMedicine={addMedicine} />
        </motion.div>
      )}

      {/* Activity log visible only to admin and inventory */}
      {!viewAI && (role === "admin" || role === "inventory") && <ActivityLog logs={state.logs} />}
    </div>
  );
}

/* ---------- small Stat ---------- */
function Stat({ title, value, tone = "slate" }) {
  const palette = {
    slate: "bg-slate-50 text-slate-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={`rounded-2xl border ${palette[tone]} p-4`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

/* ---------- Admin Panel ---------- */
function AdminPanel({ state, addUser, removeUser, pushLog }) {
  const [u, setU] = useState({ name: "", role: "doctor", password: "1234" });

  const handleAdd = () => {
    if (!u.name.trim()) return;
    addUser({ name: u.name.trim(), role: u.role, password: u.password || "1234" });
    setU({ name: "", role: "doctor", password: "1234" });
  };

  return (
    <div className="grid gap-6">
      <Card title="Manage Users" actions={<Button variant="soft" onClick={() => { /* generate report if needed */ }}>Export</Button>}>
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <Input placeholder="Name" value={u.name} onChange={(v) => setU({ ...u, name: v })} />
          <Select value={u.role} onChange={(v) => setU({ ...u, role: v })} options={[
            { value: "admin", label: "Admin" },
            { value: "inventory", label: "Inventory Manager" },
            { value: "doctor", label: "Doctor/Nurse" },
            { value: "supplier", label: "Supplier" },
          ]} />
          <Input placeholder="Password" value={u.password} onChange={(v) => setU({ ...u, password: v })} />
          <div className="md:col-span-3">
            <Button onClick={handleAdd}>Add User</Button>
          </div>
        </div>

        <Table
          columns={[
            { key: "name", header: "Name" },
            { key: "role", header: "Role" },
            { key: "actions", header: "Actions", cell: (row) => <Button variant="danger" onClick={() => removeUser(row.id)}>Remove</Button> },
          ]}
          data={state.users}
        />
      </Card>
    </div>
  );
}

/* ---------- Inventory Panel ---------- */
function InventoryPanel({ state, addMedicine, removeMedicine, approveReorder, updateOrderStatus, pushLog }) {
  const [med, setMed] = useState({ name: "", quantity: 0, expiry: todayStr(), reorderLevel: 10 });

  const handleAddMed = () => {
    if (!med.name.trim()) return;
    addMedicine({ name: med.name.trim(), quantity: Number(med.quantity), expiry: med.expiry, reorderLevel: Number(med.reorderLevel) });
    setMed({ name: "", quantity: 0, expiry: todayStr(), reorderLevel: 10 });
  };

  return (
    <div className="grid gap-6">
      <Card title="Manage Medicines">
        <div className="grid md:grid-cols-5 gap-3 mb-4">
          <Input placeholder="Name" value={med.name} onChange={(v) => setMed((s) => ({ ...s, name: v }))} />
          <Input type="number" placeholder="Qty" value={med.quantity} onChange={(v) => setMed((s) => ({ ...s, quantity: v }))} />
          <Input type="date" placeholder="Expiry" value={med.expiry} onChange={(v) => setMed((s) => ({ ...s, expiry: v }))} />
          <Input type="number" placeholder="Reorder level" value={med.reorderLevel} onChange={(v) => setMed((s) => ({ ...s, reorderLevel: v }))} />
          <Button onClick={handleAddMed}>Add Medicine</Button>
        </div>

        <Table
          columns={[
            { key: "name", header: "Medicine" },
            { key: "quantity", header: "Qty" },
            { key: "expiry", header: "Expiry", cell: (m) => <span className={isExpired(m.expiry) ? "text-rose-600 font-medium" : ""}>{m.expiry}{isExpired(m.expiry) ? " (expired)" : ""}</span> },
            { key: "reorderLevel", header: "Reorder Level" },
            { key: "actions", header: "Actions", cell: (m) => <div className="flex gap-2"><Button variant="soft" onClick={() => { /* quick order */ const qty = Math.max(1, m.reorderLevel * 2); setTimeout(() => { pushLog(`Quick order placed for ${m.name} (${qty})`); }, 0); }}>Place Order</Button><Button variant="danger" onClick={() => removeMedicine(m.id)}>Remove</Button></div> },
          ]}
          data={state.medicines}
        />
      </Card>

      <Card title="Reorder Suggestions (Approve to create Order)">
        <div className="mb-4 flex gap-2">
          <Button variant="soft" onClick={() => {
            // Auto-generate reorder suggestions for low stock medicines
            const lowStockMedicines = state.medicines.filter(m => m.quantity <= m.reorderLevel);
            lowStockMedicines.forEach(med => {
              const suggestion = {
                id: uid(),
                medicineId: med.id,
                medicine: med.name,
                qty: Math.max(med.reorderLevel * 2, 50),
                status: "Pending Approval",
                createdAt: new Date().toLocaleString(),
                reason: med.quantity === 0 ? "Out of Stock" : "Low Stock",
                priority: med.quantity === 0 ? "urgent" : "high"
              };
              setState(s => ({ ...s, reorders: [suggestion, ...s.reorders] }));
            });
            pushLog(`Auto-generated ${lowStockMedicines.length} reorder suggestions for low stock medicines`);
          }}>
            Auto-Generate Suggestions
          </Button>
          <Button variant="soft" onClick={() => {
            // Manual reorder creation
            const medicineId = prompt("Enter medicine ID for manual reorder:");
            const qty = prompt("Enter suggested quantity:");
            if (medicineId && qty) {
              const med = state.medicines.find(m => m.id === parseInt(medicineId));
              if (med) {
                const suggestion = {
                  id: uid(),
                  medicineId: med.id,
                  medicine: med.name,
                  qty: parseInt(qty),
                  status: "Pending Approval",
                  createdAt: new Date().toLocaleString(),
                  reason: "Manual",
                  priority: "normal"
                };
                setState(s => ({ ...s, reorders: [suggestion, ...s.reorders] }));
                pushLog(`Manual reorder suggestion created for ${med.name}`);
              }
            }
          }}>
            Create Manual Reorder
          </Button>
        </div>
        <Table
          columns={[
            { key: "medicine", header: "Medicine" },
            { key: "qty", header: "Qty" },
            { key: "reason", header: "Reason" },
            { key: "priority", header: "Priority", cell: (r) => (
              <span className={`px-2 py-1 rounded-full text-xs ${
                r.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                r.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                r.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {r.priority || 'normal'}
              </span>
            )},
            { key: "createdAt", header: "Created" },
            { key: "actions", header: "Actions", cell: (r) => (
              <div className="flex gap-2">
                <Button variant="green" onClick={() => approveReorder(r.id)}>Approve</Button>
                <Button variant="danger" onClick={() => {
                  setState(s => ({ ...s, reorders: s.reorders.filter(x => x.id !== r.id) }));
                  pushLog(`Reorder suggestion for ${r.medicine} was rejected`);
                }}>Reject</Button>
              </div>
            ) },
          ]}
          data={state.reorders}
          empty="No suggestions"
        />
      </Card>

      <Card title="Purchase Orders & Status">
        <Table
          columns={[
            { key: "id", header: "Order #" },
            { key: "medicine", header: "Medicine" },
            { key: "qty", header: "Qty" },
            { key: "status", header: "Status" },
            { key: "actions", header: "Actions", cell: (o) => (<div className="flex gap-2"><Button variant="soft" onClick={() => updateOrderStatus(o.id, "Pending")}>Pending</Button><Button variant="amber" onClick={() => updateOrderStatus(o.id, "Shipped")}>Shipped</Button><Button variant="green" onClick={() => updateOrderStatus(o.id, "Delivered")}>Delivered</Button></div>) },
          ]}
          data={state.orders}
          empty="No orders"
        />
      </Card>
    </div>
  );
}

/* ---------- Doctor Panel ---------- */
function DoctorPanel({ state, doctorRequest }) {
  const [selected, setSelected] = useState(state.medicines[0]?.id || 0);
  const [qty, setQty] = useState(1);
  const [requester, setRequester] = useState("Dr. Guest");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [aiWarning, setAiWarning] = useState("");

  const checkDrugSafety = async () => {
    const medName = state.medicines.find(m => m.id === selected)?.name;
    if (!medName) return;
    setAiWarning("Checking with AI...");
    try {
      const res = await fetch("http://localhost:5000/api/ai/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicines: [medName] })
      });
      const data = await res.json();
      setAiWarning(data.analysis || "No interaction insights available.");
    } catch {
      setAiWarning("AI check failed. Backend off or unconfigured.");
    }
  };

  const meds = state.medicines;

  const submit = async () => {
    setBusy(true);
    setMessage("");
    const res = await doctorRequest({ medicineId: selected, qty: Number(qty), requester });
    setBusy(false);
    if (res.dispensed) setMessage("Dispensed immediately.");
    else setMessage("Not enough stock — reorder suggestion created for inventory approval.");
  };

  return (
    <div className="grid gap-6">
      <Card title="Request Medicine">
        <div className="grid md:grid-cols-4 gap-3 items-end mb-4">
          <div>
            <label className="text-xs text-slate-600">Requester</label>
            <Input value={requester} onChange={setRequester} />
          </div>
          <div>
            <label className="text-xs text-slate-600">Medicine</label>
            <select className="w-full rounded-xl border px-3 py-2 text-sm" value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
              {meds.map((m) => <option key={m.id} value={m.id}>{m.name} (Available: {m.quantity})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-600">Quantity</label>
            <Input type="number" value={qty} onChange={setQty} />
          </div>
          <Button onClick={submit} disabled={busy}>{busy ? "Processing..." : "Request"}</Button>
        </div>
        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
          <div className="text-sm text-slate-700 font-medium">✨ AI Safety Check for selected medicine</div>
          <Button variant="soft" onClick={checkDrugSafety}>Analyze FDA Data</Button>
        </div>
        {aiWarning && <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl text-sm italic">{aiWarning}</div>}
        {message && <div className="mt-3 text-sm text-slate-700">{message}</div>}
      </Card>

      <Card title="Recent Requests">
        <Table
          columns={[
            { key: "id", header: "Req #" },
            { key: "medicine", header: "Medicine" },
            { key: "qty", header: "Qty" },
            { key: "requester", header: "Requester" },
            { key: "status", header: "Status" },
            { key: "time", header: "Time" },
          ]}
          data={state.requests.slice(0, 20)}
          empty="No requests"
        />
      </Card>
    </div>
  );
}

/* ---------- Supplier Panel ---------- */
function SupplierPanel({ state, updateOrderStatus }) {
  const [supplierId] = useState(state.suppliers[0]?.id || 0);
  const orders = state.orders.filter((o) => o.supplierId === supplierId || supplierId === null);

  return (
    <div className="grid gap-6">
      <Card title="Supplier — Purchase Orders">
        <Table
          columns={[
            { key: "id", header: "Order #" },
            { key: "medicine", header: "Medicine" },
            { key: "qty", header: "Qty" },
            { key: "status", header: "Status" },
            { key: "actions", header: "Action", cell: (o) => <div className="flex gap-2"><Button variant="amber" onClick={() => updateOrderStatus(o.id, "Shipped")}>Shipped</Button><Button variant="green" onClick={() => updateOrderStatus(o.id, "Delivered")}>Delivered</Button></div> },
          ]}
          data={orders}
          empty="No orders for this supplier."
        />
      </Card>
    </div>
  );
}

/* ---------- Activity Log (visible to admin & inventory) ---------- */
function ActivityLog({ logs }) {
  return (
    <Card title="System Activity Log">
      <div className="space-y-2 max-h-72 overflow-auto text-sm">
        {logs.length === 0 && <div className="text-slate-500">No activity yet.</div>}
        {logs.map((l) => (
          <div key={l.id} className="flex gap-2">
            <div className="text-slate-400 w-40">{l.time}</div>
            <div>{l.text}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
