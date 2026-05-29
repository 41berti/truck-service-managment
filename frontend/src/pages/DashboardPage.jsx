import { AlertTriangle, Boxes, CalendarDays, ClipboardCheck, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { listAppointments } from "../services/appointmentService.js";
import { listAttendance } from "../services/attendanceService.js";
import { getStockSummary } from "../services/stockService.js";
import { getTransactionSummary } from "../services/transactionService.js";
import { getCurrentPeriod, getMonthRange, getPeriodLabel } from "../utils/date.js";

const modules = [
  {
    title: "Stoku",
    description: "Moduli aktiv për kërkim, alarm low-stock dhe CRUD.",
    status: "Aktiv",
    icon: Boxes,
    to: "/stock",
    roles: ["ADMIN"],
  },
  {
    title: "Financa",
    description: "Regjistro hyrje dhe shpenzime me përmbledhje financiare.",
    status: "Aktiv",
    icon: WalletCards,
    to: "/finance",
    roles: ["ADMIN"],
  },
  {
    title: "Prezenca",
    description: "Regjistro hyrje/dalje të punëtorëve për ditën e punës.",
    status: "Aktiv",
    icon: ClipboardCheck,
    to: "/attendance",
    roles: ["ADMIN", "MECHANIC", "GUARD"],
  },
  {
    title: "Terminet",
    description: "Regjistro klientin, kamionin dhe datën e servisit.",
    status: "Aktiv",
    icon: CalendarDays,
    to: "/appointments",
    roles: ["ADMIN"],
  },
];

function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const currentPeriod = getCurrentPeriod();
  const currentRange = getMonthRange(currentPeriod.month, currentPeriod.year);
  const [overview, setOverview] = useState({
    appointments: [],
    attendance: [],
    finance: null,
    stock: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      setIsLoading(true);

      try {
        const attendancePromise = listAttendance(currentRange);

        if (isAdmin) {
          const [attendanceResult, stockResult, financeResult, appointmentResult] =
            await Promise.all([
              attendancePromise,
              getStockSummary(),
              getTransactionSummary(currentRange),
              listAppointments(currentRange),
            ]);

          if (isMounted) {
            setOverview({
              appointments: appointmentResult.appointments || [],
              attendance: attendanceResult.records || [],
              finance: financeResult.summary || null,
              stock: stockResult.summary || null,
            });
          }
        } else {
          const attendanceResult = await attendancePromise;

          if (isMounted) {
            setOverview((current) => ({
              ...current,
              attendance: attendanceResult.records || [],
            }));
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const activeAttendance = overview.attendance.filter((record) => !record.check_out);
  const scheduledAppointments = overview.appointments.filter(
    (appointment) => appointment.status === "SCHEDULED"
  );

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Mirë se erdhe, {user?.full_name || "Admin"}</h2>
        </div>
        <div className="header-note">
          <AlertTriangle size={18} />
          {isAdmin
            ? `Përmbledhje operative për ${getPeriodLabel(currentPeriod.month, currentPeriod.year)}`
            : "Qasje operative për evidencën e prezencës"}
        </div>
      </header>

      <section className="dashboard-band">
        <div>
          <p className="eyebrow">Sot në servis</p>
          <h3>Kontroll i shpejtë i operacioneve</h3>
        </div>
        <p>
          Shiko gjendjen e stokut, financat mujore, prezencën aktive dhe
          terminet e planifikuara nga një vend i vetëm.
        </p>
      </section>

      <section className="summary-grid">
        {isAdmin ? (
          <>
            <article className="summary-card">
              <span>Bilanci mujor</span>
              <strong>
                {new Intl.NumberFormat("sq-AL", {
                  currency: "EUR",
                  style: "currency",
                }).format(Number(overview.finance?.balance || 0))}
              </strong>
            </article>
            <article className="summary-card warning">
              <span>Low-stock</span>
              <strong>{overview.stock?.low_stock_items ?? (isLoading ? "--" : 0)}</strong>
            </article>
            <article className="summary-card">
              <span>Prezenca aktive</span>
              <strong>{activeAttendance.length}</strong>
            </article>
            <article className="summary-card">
              <span>Termine të planifikuara</span>
              <strong>{scheduledAppointments.length}</strong>
            </article>
          </>
        ) : (
          <>
            <article className="summary-card">
              <span>Regjistrime mujore</span>
              <strong>{overview.attendance.length}</strong>
            </article>
            <article className="summary-card warning">
              <span>Aktivë tani</span>
              <strong>{activeAttendance.length}</strong>
            </article>
          </>
        )}
      </section>

      <section className="module-grid" aria-label="Modulet">
        {modules
          .filter((module) => module.roles.includes(user?.role))
          .map((module) => {
          const Icon = module.icon;
          const content = (
            <>
              <div className="module-icon">
                <Icon size={22} />
              </div>
              <div>
                <span className={`status-pill ${module.status === "Aktiv" ? "active" : ""}`}>
                  {module.status}
                </span>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
              </div>
            </>
          );

          return module.to ? (
            <Link className="module-card module-card-link" key={module.title} to={module.to}>
              {content}
            </Link>
          ) : (
            <article className="module-card" key={module.title}>
              {content}
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default DashboardPage;
