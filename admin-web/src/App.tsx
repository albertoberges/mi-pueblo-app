import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Noticias from "./pages/Noticias";
import Incidencias from "./pages/Incidencias";

const navItems = [
  { to: "/", label: "Dashboard", icon: "🏠" },
  { to: "/noticias", label: "Noticias", icon: "📰" },
  { to: "/incidencias", label: "Incidencias", icon: "⚠️" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-56 bg-slate-800 flex-shrink-0 flex flex-col">
          <div className="px-4 py-5 border-b border-slate-700">
            <div className="text-white font-bold text-lg">🏛️ Mi Pueblo</div>
            <div className="text-slate-400 text-xs mt-0.5">Panel Ayuntamiento</div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-slate-700">
            <div className="text-slate-400 text-xs">v1.0.0</div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/incidencias" element={<Incidencias />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
