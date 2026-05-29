import { AlertCircle, CheckCircle2, Clock, Edit3, Printer, RefreshCw, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  createAttendanceRecord,
  deleteAttendanceRecord,
  listAttendance,
  listAttendanceUsers,
  saveAttendanceCheckOut,
  updateAttendanceRecord,
} from "../services/attendanceService.js";
import {
  buildYearOptions,
  formatDate,
  formatDateTime,
  getCurrentPeriod,
  getMonthRange,
  getPeriodLabel,
  monthNames,
} from "../utils/date.js";

const today = new Date().toISOString().slice(0, 10);
const currentTime = new Date().toTimeString().slice(0, 5);
const currentPeriod = getCurrentPeriod();

function toDateTime(date, time) {
  return `${date}T${time}:00`;
}

function sameDate(left, right) {
  return String(left).slice(0, 10) === String(right).slice(0, 10);
}

function getAttendanceStatus(record) {
  if (!record) {
    return "new";
  }

  return record.check_out ? "done" : "active";
}

function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [period, setPeriod] = useState(currentPeriod);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState({
    user_id: "",
    work_date: today,
    check_in_time: currentTime,
    check_out_time: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const periodRange = getMonthRange(period.month, period.year);
  const periodLabel = getPeriodLabel(period.month, period.year);

  const selectedRecord = records.find(
    (record) =>
      String(record.user_id) === String(form.user_id) &&
      sameDate(record.work_date, form.work_date)
  );
  const selectedStatus = getAttendanceStatus(selectedRecord);
  const activeRecords = records.filter((record) => !record.check_out);
  const completedToday = records.filter(
    (record) => sameDate(record.work_date, today) && record.check_out
  );

  async function loadAttendance(keepMessages = false, nextPeriod = period) {
    if (!keepMessages) {
      setError("");
      setSuccess("");
    }

    setIsLoading(true);

    try {
      const [usersResult, recordsResult] = await Promise.all([
        listAttendanceUsers(),
        listAttendance(getMonthRange(nextPeriod.month, nextPeriod.year)),
      ]);

      setUsers(usersResult.users || []);
      setRecords(recordsResult.records || []);

      if (!form.user_id && usersResult.users?.length) {
        setForm((current) => ({ ...current, user_id: String(usersResult.users[0].id) }));
      }
    } catch (apiError) {
      setError(apiError.message || "Prezenca nuk u lexua me sukses.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance(false, period);
  }, []);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updatePeriod(event) {
    const { name, value } = event.target;
    const nextPeriod = {
      ...period,
      [name]: Number(value),
    };

    setPeriod(nextPeriod);
    setEditingRecord(null);
    loadAttendance(false, nextPeriod);
  }

  function startEdit(record) {
    setEditingRecord(record);
    setForm({
      user_id: String(record.user_id),
      work_date: String(record.work_date).slice(0, 10),
      check_in_time: new Date(record.check_in).toTimeString().slice(0, 5),
      check_out_time: record.check_out
        ? new Date(record.check_out).toTimeString().slice(0, 5)
        : "",
      notes: record.notes || "",
    });
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditingRecord(null);
    setForm({
      user_id: users[0]?.id ? String(users[0].id) : "",
      work_date: today,
      check_in_time: currentTime,
      check_out_time: "",
      notes: "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.user_id) {
      setError("Zgjidh punëtorin.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingRecord && isAdmin) {
        await updateAttendanceRecord(editingRecord.id, {
          user_id: Number(form.user_id),
          work_date: form.work_date,
          check_in: toDateTime(form.work_date, form.check_in_time),
          check_out: form.check_out_time
            ? toDateTime(form.work_date, form.check_out_time)
            : "",
          notes: form.notes,
        });
        setEditingRecord(null);
        setSuccess("Prezenca u përditësua me sukses.");
        await loadAttendance(true, period);
        return;
      } else if (selectedStatus === "done") {
        setError("Ky punëtor e ka përfunduar tashmë prezencën për këtë datë.");
        return;
      }

      if (selectedStatus === "active") {
        await saveAttendanceCheckOut(selectedRecord.id, {
          check_out: toDateTime(form.work_date, form.check_out_time || currentTime),
        });
        setSuccess("Dalja u regjistrua me sukses.");
      } else {
        await createAttendanceRecord({
          user_id: Number(form.user_id),
          work_date: form.work_date,
          check_in: toDateTime(form.work_date, form.check_in_time),
          notes: form.notes,
        });
        setSuccess("Hyrja u regjistrua me sukses.");
      }

      setForm((current) => ({
        ...current,
        check_in_time: currentTime,
        check_out_time: "",
        notes: "",
      }));
      await loadAttendance(true, period);
    } catch (apiError) {
      setError(apiError.message || "Prezenca nuk u ruajt me sukses.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(record) {
    const confirmed = window.confirm(
      `A je i sigurt që dëshiron ta fshish prezencën për ${record.employee_name}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteAttendanceRecord(record.id);
      if (editingRecord?.id === record.id) {
        cancelEdit();
      }
      setSuccess("Prezenca u fshi me sukses.");
      await loadAttendance(true, period);
    } catch (apiError) {
      setError(apiError.message || "Prezenca nuk u fshi me sukses.");
    }
  }

  async function handleCheckOut(record) {
    setError("");
    setSuccess("");

    try {
      await saveAttendanceCheckOut(record.id, {
        check_out: new Date().toISOString(),
      });
      setSuccess("Dalja u regjistrua me sukses.");
      await loadAttendance(true, period);
    } catch (apiError) {
      setError(apiError.message || "Dalja nuk u ruajt me sukses.");
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Prezenca</p>
          <h2>Prezenca për {periodLabel}</h2>
        </div>
        <div className="header-actions">
          {isAdmin ? (
            <button className="secondary-button print-actions" type="button" onClick={() => window.print()}>
              <Printer size={18} />
              Printo
            </button>
          ) : null}
          <button className="secondary-button" type="button" onClick={() => loadAttendance()}>
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
          <span>Punëtorë aktivë</span>
          <strong>{activeRecords.length}</strong>
        </article>
        <article className="summary-card">
          <span>Regjistrime totale</span>
          <strong>{records.length}</strong>
        </article>
        <article className="summary-card">
          <span>Të mbyllura sot</span>
          <strong>{completedToday.length}</strong>
        </article>
        <article className="summary-card warning">
          <span>Statusi i zgjedhur</span>
          <strong>
            {selectedStatus === "active"
              ? "Aktiv"
              : selectedStatus === "done"
                ? "Mbyllur"
                : "I ri"}
          </strong>
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
          <div className="table-wrap">
            {isLoading ? (
              <div className="state-panel">
                <div className="loader" />
                <p>Duke lexuar prezencën...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="state-panel">Ende nuk ka evidenca të regjistruara.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Punëtori</th>
                    <th>Statusi</th>
                    <th>Hyrja</th>
                    <th>Dalja</th>
                    <th>Orë</th>
                    <th>Shënime</th>
                    <th>Veprime</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.work_date)}</td>
                      <td>
                        <strong>{record.employee_name}</strong>
                        <span>{record.employee_role}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${record.check_out ? "success" : "warning"}`}>
                          {record.check_out ? "Mbyllur" : "Aktiv"}
                        </span>
                      </td>
                      <td>{formatDateTime(record.check_in)}</td>
                      <td>{formatDateTime(record.check_out)}</td>
                      <td>{record.total_hours}</td>
                      <td>{record.notes || "-"}</td>
                      <td>
                        {!record.check_out ? (
                          <button className="secondary-button" type="button" onClick={() => handleCheckOut(record)}>
                            <Clock size={16} />
                            Dalje
                          </button>
                        ) : (
                          "-"
                        )}
                        {isAdmin ? (
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              type="button"
                              onClick={() => startEdit(record)}
                              title="Përditëso prezencën"
                              aria-label={`Përditëso prezencën për ${record.employee_name}`}
                            >
                              <Edit3 size={17} />
                            </button>
                            <button
                              className="icon-button danger"
                              type="button"
                              onClick={() => handleDelete(record)}
                              title="Fshi prezencën"
                              aria-label={`Fshi prezencën për ${record.employee_name}`}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        ) : null}
                      </td>
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
              <p className="eyebrow">
                {selectedStatus === "active"
                  ? "Dalje"
                  : editingRecord
                    ? "Përditësim"
                  : selectedStatus === "done"
                    ? "E mbyllur"
                    : "Hyrje"}
              </p>
              <h3>
                {selectedStatus === "active"
                  ? "Regjistro daljen"
                  : editingRecord
                    ? "Përditëso prezencën"
                  : selectedStatus === "done"
                    ? "Prezenca është mbyllur"
                    : "Regjistro hyrjen"}
              </h3>
            </div>
            {editingRecord ? (
              <button
                className="icon-button"
                type="button"
                onClick={cancelEdit}
                title="Anulo përditësimin"
                aria-label="Anulo përditësimin"
              >
                <X size={18} />
              </button>
            ) : (
              <Clock size={20} />
            )}
          </div>

          <form className="stock-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Punëtori</span>
              <select name="user_id" required value={form.user_id} onChange={updateForm}>
                <option value="">Zgjidh punëtorin</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} - {user.role}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Data</span>
              <input name="work_date" type="date" required value={form.work_date} onChange={updateForm} />
            </label>
            <div className="form-row">
              <label className="field">
                <span>Hyrja</span>
                <input
                  disabled={!editingRecord && (selectedStatus === "active" || selectedStatus === "done")}
                  name="check_in_time"
                  type="time"
                  required
                  value={form.check_in_time}
                  onChange={updateForm}
                />
              </label>
              <label className="field">
                <span>Dalja</span>
                <input
                  disabled={!editingRecord && selectedStatus !== "active"}
                  name="check_out_time"
                  type="time"
                  value={form.check_out_time}
                  onChange={updateForm}
                />
              </label>
            </div>
            <label className="field">
              <span>Shënime</span>
              <input name="notes" value={form.notes} onChange={updateForm} />
            </label>
            {selectedStatus === "active" ? (
              <div className="inline-status warning">
                Punëtori është aktualisht në punë. Veprimi tjetër regjistron daljen.
              </div>
            ) : null}
            {selectedStatus === "done" ? (
              <div className="inline-status success">
                Prezenca për këtë datë është mbyllur.
              </div>
            ) : null}
            <button className="primary-button" disabled={isSaving || (!editingRecord && selectedStatus === "done")} type="submit">
              {isSaving
                ? "Duke ruajtur..."
                : editingRecord
                  ? "Ruaj ndryshimet"
                : selectedStatus === "active"
                  ? "Regjistro daljen"
                  : "Regjistro hyrjen"}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}

export default AttendancePage;
