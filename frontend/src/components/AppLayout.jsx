import {
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardCheck,
  LogOut,
  Moon,
  PackageSearch,
  Sun,
  WalletCards,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const navigationLinks = [
  { label: "Dashboard", icon: BarChart3, to: "/dashboard", roles: ["ADMIN", "MECHANIC", "GUARD"] },
  { label: "Stoku", icon: PackageSearch, to: "/stock", roles: ["ADMIN"] },
  { label: "Financa", icon: WalletCards, to: "/finance", roles: ["ADMIN"] },
  { label: "Prezenca", icon: ClipboardCheck, to: "/attendance", roles: ["ADMIN", "MECHANIC", "GUARD"] },
  { label: "Terminet", icon: CalendarDays, to: "/appointments", roles: ["ADMIN"] },
];

function AppLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Boxes size={24} />
          </div>
          <div>
            <p className="eyebrow">Truck Service</p>
            <h1>Menaxhimi</h1>
          </div>
        </div>

        <nav className="main-nav" aria-label="Navigimi kryesor">
          {navigationLinks
            .filter((module) => module.roles.includes(user?.role))
            .map((module) => {
              const Icon = module.icon;
              return (
                <NavLink className="nav-link" key={module.to} to={module.to}>
                  <Icon size={20} />
                  {module.label}
                </NavLink>
              );
            })}
        </nav>

        <div className="planned-nav">
          <p>Demo e gatshme</p>
          <span className="planned-link">Login, stok, financa, prezencë, termine</span>
        </div>

        <div className="sidebar-footer">
          <div>
            <span className="user-name">{user?.full_name || "Admin"}</span>
            <span className="user-role">{user?.role || "ADMIN"}</span>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Kalo në light mode" : "Kalo në dark mode"}
            aria-label={isDark ? "Kalo në light mode" : "Kalo në dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={handleLogout}
            title="Dil nga llogaria"
            aria-label="Dil nga llogaria"
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
