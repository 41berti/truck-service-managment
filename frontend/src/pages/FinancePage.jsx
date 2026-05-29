import { AlertCircle, CheckCircle2, Edit3, Plus, Printer, RefreshCw, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createTransaction,
  deleteTransaction,
  getTransactionSummary,
  listTransactions,
  updateTransaction,
} from "../services/transactionService.js";
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
  type: "INCOME",
  amount: "",
  description: "",
  category: "Servis",
  tx_date: today,
};

function currency(value) {
  return new Intl.NumberFormat("sq-AL", {
    currency: "EUR",
    style: "currency",
  }).format(Number(value || 0));
}

function FinancePage() {
  const [transactions, setTransactions] = useState([]);
  const [yearTransactions, setYearTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [period, setPeriod] = useState(currentPeriod);
  const [form, setForm] = useState(emptyForm);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const periodRange = getMonthRange(period.month, period.year);
  const periodLabel = getPeriodLabel(period.month, period.year);
  const monthlyBreakdown = useMemo(() => {
    const totals = monthNames.map((name, index) => ({
      balance: 0,
      expense: 0,
      income: 0,
      month: index + 1,
      name,
    }));

    yearTransactions.forEach((transaction) => {
      const monthIndex = new Date(transaction.tx_date).getMonth();

      if (transaction.type === "INCOME") {
        totals[monthIndex].income += Number(transaction.amount);
        totals[monthIndex].balance += Number(transaction.amount);
      } else {
        totals[monthIndex].expense += Number(transaction.amount);
        totals[monthIndex].balance -= Number(transaction.amount);
      }
    });

    return totals;
  }, [yearTransactions]);
  const maxMonthlyValue = Math.max(
    1,
    ...monthlyBreakdown.map((item) => Math.max(item.income, item.expense))
  );

  async function loadFinance(type = filterType, nextPeriod = period, keepMessages = false) {
    if (!keepMessages) {
      setError("");
      setSuccess("");
    }

    setIsLoading(true);

    try {
      const range = getMonthRange(nextPeriod.month, nextPeriod.year);
      const params = {
        from: range.from,
        to: range.to,
        ...(type ? { type } : {}),
      };
      const yearRange = {
        from: `${nextPeriod.year}-01-01`,
        to: `${nextPeriod.year}-12-31`,
      };
      const [listResult, summaryResult, yearResult] = await Promise.all([
        listTransactions(params),
        getTransactionSummary(range),
        listTransactions(yearRange),
      ]);

      setTransactions(listResult.transactions || []);
      setSummary(summaryResult.summary || null);
      setYearTransactions(yearResult.transactions || []);
    } catch (apiError) {
      setError(apiError.message || "Transaksionet nuk u lexuan me sukses.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFinance();
  }, []);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateFilter(event) {
    const nextType = event.target.value;
    setFilterType(nextType);
    loadFinance(nextType, period);
  }

  function updatePeriod(event) {
    const { name, value } = event.target;
    const nextPeriod = {
      ...period,
      [name]: Number(value),
    };

    setPeriod(nextPeriod);
    loadFinance(filterType, nextPeriod);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (Number(form.amount) <= 0) {
      setError("Shuma duhet të jetë më e madhe se 0.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
        category: form.category,
        tx_date: form.tx_date,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload);
        setSuccess("Transaksioni u përditësua me sukses.");
      } else {
        await createTransaction(form.type, payload);
        setSuccess("Transaksioni u regjistrua me sukses.");
      }

      setEditingTransaction(null);
      setForm(emptyForm);
      await loadFinance(filterType, period, true);
    } catch (apiError) {
      setError(apiError.message || "Transaksioni nuk u ruajt me sukses.");
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(transaction) {
    setEditingTransaction(transaction);
    setForm({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      tx_date: String(transaction.tx_date).slice(0, 10),
    });
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditingTransaction(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  async function handleDelete(transaction) {
    const confirmed = window.confirm(
      `A je i sigurt që dëshiron ta fshish transaksionin "${transaction.description}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteTransaction(transaction.id);
      if (editingTransaction?.id === transaction.id) {
        cancelEdit();
      }
      setSuccess("Transaksioni u fshi me sukses.");
      await loadFinance(filterType, period, true);
    } catch (apiError) {
      setError(apiError.message || "Transaksioni nuk u fshi me sukses.");
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Financa</p>
          <h2>Financa për {periodLabel}</h2>
        </div>
        <div className="header-actions">
          <button className="secondary-button print-actions" type="button" onClick={() => window.print()}>
            <Printer size={18} />
            Printo raportin
          </button>
          <button className="secondary-button" type="button" onClick={() => loadFinance()}>
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
          <span>Periudha</span>
          <strong>
            {formatDate(periodRange.from)} - {formatDate(periodRange.to)}
          </strong>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <span>Hyrje totale</span>
          <strong>{currency(summary?.total_income)}</strong>
        </article>
        <article className="summary-card warning">
          <span>Shpenzime totale</span>
          <strong>{currency(summary?.total_expense)}</strong>
        </article>
        <article className="summary-card">
          <span>Bilanci</span>
          <strong>{currency(summary?.balance)}</strong>
        </article>
        <article className="summary-card">
          <span>Regjistrime</span>
          <strong>{transactions.length}</strong>
        </article>
      </section>

      {(error || success) && (
        <div className={`alert ${error ? "alert-error" : "alert-success"}`}>
          {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {error || success}
        </div>
      )}

      <section className="chart-panel">
        <div className="chart-heading">
          <div>
            <p className="eyebrow">Analitikë vjetore</p>
            <h3>Hyrje dhe shpenzime gjatë vitit {period.year}</h3>
          </div>
        </div>
        <div className="bar-chart" aria-label={`Analitika financiare për vitin ${period.year}`}>
          {monthlyBreakdown.map((item) => (
            <div className="bar-group" key={item.month}>
              <div className="bar-track">
                <span
                  className="bar income"
                  style={{ height: `${Math.max(4, (item.income / maxMonthlyValue) * 100)}%` }}
                  title={`Hyrje: ${currency(item.income)}`}
                />
                <span
                  className="bar expense"
                  style={{ height: `${Math.max(4, (item.expense / maxMonthlyValue) * 100)}%` }}
                  title={`Shpenzime: ${currency(item.expense)}`}
                />
              </div>
              <span>{item.name.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="stock-workspace">
        <div className="stock-list-panel">
          <div className="toolbar toolbar-compact">
            <select value={filterType} onChange={updateFilter}>
              <option value="">Raport i kombinuar</option>
              <option value="INCOME">Vetëm hyrje</option>
              <option value="EXPENSE">Vetëm shpenzime</option>
            </select>
          </div>

          <div className="table-wrap">
            {isLoading ? (
              <div className="state-panel">
                <div className="loader" />
                <p>Duke lexuar financat...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="state-panel">Nuk ka transaksione për këtë filtër.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Lloji</th>
                    <th>Përshkrimi</th>
                    <th>Kategoria</th>
                    <th>Shuma</th>
                    <th>Veprime</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.tx_date)}</td>
                      <td>
                        <span className={`status-badge ${transaction.type === "INCOME" ? "success" : "danger"}`}>
                          {transaction.type === "INCOME" ? "Hyrje" : "Shpenzim"}
                        </span>
                      </td>
                      <td>{transaction.description}</td>
                      <td>
                        <span className="category-badge">{transaction.category}</span>
                      </td>
                      <td>{currency(transaction.amount)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => startEdit(transaction)}
                            title="Përditëso transaksionin"
                            aria-label={`Përditëso ${transaction.description}`}
                          >
                            <Edit3 size={17} />
                          </button>
                          <button
                            className="icon-button danger"
                            type="button"
                            onClick={() => handleDelete(transaction)}
                            title="Fshi transaksionin"
                            aria-label={`Fshi ${transaction.description}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
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
              <p className="eyebrow">Regjistrim</p>
              <h3>{editingTransaction ? "Përditëso transaksionin" : "Transaksion i ri"}</h3>
            </div>
            {editingTransaction ? (
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
              <Plus size={20} />
            )}
          </div>

          <form className="stock-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Lloji</span>
              <select name="type" onChange={updateForm} value={form.type}>
                <option value="INCOME">Hyrje</option>
                <option value="EXPENSE">Shpenzim</option>
              </select>
            </label>
            <label className="field">
              <span>Shuma</span>
              <input name="amount" min="0" step="0.01" type="number" required value={form.amount} onChange={updateForm} />
            </label>
            <label className="field">
              <span>Përshkrimi</span>
              <input name="description" required value={form.description} onChange={updateForm} />
            </label>
            <label className="field">
              <span>Kategoria</span>
              <input name="category" required value={form.category} onChange={updateForm} />
            </label>
            <label className="field">
              <span>Data</span>
              <input name="tx_date" type="date" required value={form.tx_date} onChange={updateForm} />
            </label>
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving
                ? "Duke ruajtur..."
                : editingTransaction
                  ? "Ruaj ndryshimet"
                  : "Ruaj transaksionin"}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}

export default FinancePage;
