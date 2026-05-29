import { AlertCircle, CalendarPlus, CheckCircle2, Printer, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
} from "../services/appointmentService.js";
import {
  buildYearOptions,
  formatDate,
  getCurrentPeriod,
  getMonthRange,
  getPeriodLabel,
  monthNames,
} from "../utils/date.js";

const today = new Date().toISOString().slice(0, 10);
const currentPeriod = getCurrentPeriod();

const emptyForm = {
  client_name: "",
  client_phone: "",
  company_name: "",
  plate_number: "",
  brand: "Scania",
  model: "",
  service_date: today,
  issue_description: "",
  status: "SCHEDULED",
};

const statusLabels = {
  SCHEDULED: "Planifikuar",
  IN_PROGRESS: "Në punë",
  DONE: "Përfunduar",
  CANCELLED: "Anuluar",
};

function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [period, setPeriod] = useState(currentPeriod);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const periodRange = getMonthRange(period.month, period.year);
  const periodLabel = getPeriodLabel(period.month, period.year);

  async function loadAppointments(status = statusFilter, nextPeriod = period, keepMessages = false) {
    if (!keepMessages) {
      setError("");
      setSuccess("");
    }

    setIsLoading(true);

    try {
      const range = getMonthRange(nextPeriod.month, nextPeriod.year);
      const result = await listAppointments({
        from: range.from,
        to: range.to,
        ...(status ? { status } : {}),
      });
      setAppointments(result.appointments || []);
    } catch (apiError) {
      setError(apiError.message || "Terminet nuk u lexuan me sukses.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateFilter(event) {
    const nextStatus = event.target.value;
    setStatusFilter(nextStatus);
    loadAppointments(nextStatus, period);
  }

  function updatePeriod(event) {
    const { name, value } = event.target;
    const nextPeriod = {
      ...period,
      [name]: Number(value),
    };

    setPeriod(nextPeriod);
    loadAppointments(statusFilter, nextPeriod);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      await createAppointment(form);
      setForm(emptyForm);
      setSuccess("Termini u regjistrua me sukses.");
      await loadAppointments(statusFilter, period, true);
    } catch (apiError) {
      setError(apiError.message || "Termini nuk u ruajt me sukses.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(appointment, status) {
    setError("");
    setSuccess("");

    try {
      await updateAppointmentStatus(appointment.id, status);
      setSuccess("Statusi i terminit u përditësua me sukses.");
      await loadAppointments(statusFilter, period, true);
    } catch (apiError) {
      setError(apiError.message || "Statusi nuk u përditësua me sukses.");
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Terminet</p>
          <h2>Terminet për {periodLabel}</h2>
        </div>
        <div className="header-actions">
          <button className="secondary-button print-actions" type="button" onClick={() => window.print()}>
            <Printer size={18} />
            Printo
          </button>
          <button className="secondary-button" type="button" onClick={() => loadAppointments()}>
            <RefreshCw size={18} />
            Rifresko
          </button>
        </div>
      </header>

      <section className="period-panel print-actions">
        <label className="field">
          <span>Muaji</span>
          <select name="month" value={period.month} onChange={updatePeriod}>
            {monthNames.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Viti</span>
          <select name="year" value={period.year} onChange={updatePeriod}>
            {buildYearOptions().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <div className="report-meta">
          <span>Raporti</span>
          <strong>
            {formatDate(periodRange.from)} - {formatDate(periodRange.to)}
          </strong>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <span>Termine totale</span>
          <strong>{appointments.length}</strong>
        </article>
        <article className="summary-card">
          <span>Planifikuar</span>
          <strong>{appointments.filter((item) => item.status === "SCHEDULED").length}</strong>
        </article>
        <article className="summary-card warning">
          <span>Në punë</span>
          <strong>{appointments.filter((item) => item.status === "IN_PROGRESS").length}</strong>
        </article>
        <article className="summary-card">
          <span>Përfunduar</span>
          <strong>{appointments.filter((item) => item.status === "DONE").length}</strong>
        </article>
      </section>

      {(error || success) && (
        <div className={`alert ${error ? "alert-error" : "alert-success"}`}>
          {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {error || success}
        </div>
      )}

      <section className="stock-workspace">
        <div className="stock-list-panel">
          <div className="toolbar toolbar-compact">
            <select value={statusFilter} onChange={updateFilter}>
              <option value="">Të gjitha statuset</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            {isLoading ? (
              <div className="state-panel">
                <div className="loader" />
                <p>Duke lexuar terminet...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="state-panel">Ende nuk ka termine të regjistruara.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Klienti</th>
                    <th>Kamioni</th>
                    <th>Statusi</th>
                    <th>Përshkrimi</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{formatDate(appointment.service_date)}</td>
                      <td>
                        <strong>{appointment.client_name}</strong>
                        <span>{appointment.client_phone || appointment.company_name || "-"}</span>
                      </td>
                      <td>
                        <strong>{appointment.plate_number}</strong>
                        <span>
                          {appointment.brand} {appointment.model}
                        </span>
                      </td>
                      <td>
                        <select
                          className={`status-select ${appointment.status.toLowerCase()}`}
                          value={appointment.status}
                          onChange={(event) =>
                            handleStatusChange(appointment, event.target.value)
                          }
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{appointment.issue_description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside className="stock-form-panel">
          <div className="form-heading">
            <div>
              <p className="eyebrow">Regjistrim</p>
              <h3>Termin i ri</h3>
            </div>
            <CalendarPlus size={20} />
          </div>

          <form className="stock-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Klienti</span>
              <input name="client_name" required value={form.client_name} onChange={updateForm} />
            </label>
            <div className="form-row">
              <label className="field">
                <span>Telefoni</span>
                <input name="client_phone" value={form.client_phone} onChange={updateForm} />
              </label>
              <label className="field">
                <span>Kompania</span>
                <input name="company_name" value={form.company_name} onChange={updateForm} />
              </label>
            </div>
            <div className="form-row">
              <label className="field">
                <span>Targa</span>
                <input name="plate_number" required value={form.plate_number} onChange={updateForm} />
              </label>
              <label className="field">
                <span>Marka</span>
                <input name="brand" required value={form.brand} onChange={updateForm} />
              </label>
            </div>
            <label className="field">
              <span>Modeli</span>
              <input name="model" value={form.model} onChange={updateForm} />
            </label>
            <label className="field">
              <span>Data e servisit</span>
              <input name="service_date" type="date" required value={form.service_date} onChange={updateForm} />
            </label>
            <label className="field">
              <span>Statusi</span>
              <select name="status" value={form.status} onChange={updateForm}>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Përshkrimi</span>
              <input name="issue_description" value={form.issue_description} onChange={updateForm} />
            </label>
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Duke ruajtur..." : "Regjistro termin"}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}

export default AppointmentsPage;
