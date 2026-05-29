import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createStockItem,
  deleteStockItem,
  getLowStockItems,
  getStockSummary,
  listStockItems,
  updateStockItem,
} from "../services/stockService.js";

const emptyForm = {
  item_code: "",
  name: "",
  category: "General",
  unit: "pcs",
  current_qty: 0,
  min_qty: 0,
  unit_cost: 1,
  supplier: "",
  location: "",
  is_active: true,
};

const sortOptions = [
  { label: "Emër", value: "name" },
  { label: "Kategori", value: "category" },
  { label: "Sasi", value: "current_qty" },
  { label: "Minimum", value: "min_qty" },
  { label: "Çmim", value: "unit_cost" },
  { label: "Data", value: "created_at" },
];

function normalizeFormPayload(form) {
  return {
    ...form,
    current_qty: Number(form.current_qty),
    min_qty: Number(form.min_qty),
    unit_cost: Number(form.unit_cost),
    is_active: Boolean(form.is_active),
  };
}

function currency(value) {
  return new Intl.NumberFormat("sq-AL", {
    currency: "EUR",
    style: "currency",
  }).format(Number(value || 0));
}

function StockPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    onlyLowStock: false,
    sortBy: "name",
    sortOrder: "asc",
  });
  const [form, setForm] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = useMemo(() => {
    return [...new Set(items.map((item) => item.category).filter(Boolean))].sort();
  }, [items]);

  async function loadStock(nextFilters = filters, options = {}) {
    if (!options.keepMessages) {
      setError("");
    }

    setIsLoading(true);

    try {
      const params = {
        ...nextFilters,
        onlyLowStock: nextFilters.onlyLowStock ? "true" : "",
      };

      const [listResult, summaryResult, lowStockResult] = await Promise.all([
        listStockItems(params),
        getStockSummary(),
        getLowStockItems(),
      ]);

      setItems(listResult.items || []);
      setSummary(summaryResult.summary || null);
      setLowStockItems(lowStockResult.items || []);
    } catch (apiError) {
      setError(apiError.message || "Stoku nuk u lexua me sukses.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStock();
  }, []);

  function updateFilter(event) {
    const { name, type, checked, value } = event.target;
    const nextFilters = {
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    };

    setFilters(nextFilters);
    loadStock(nextFilters);
  }

  function showOnlyLowStock() {
    const nextFilters = {
      ...filters,
      onlyLowStock: true,
    };

    setFilters(nextFilters);
    loadStock(nextFilters);
  }

  function updateForm(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startCreate() {
    setEditingItem(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  function startEdit(item) {
    setEditingItem(item);
    setForm({
      item_code: item.item_code,
      name: item.name,
      category: item.category,
      unit: item.unit,
      current_qty: item.current_qty,
      min_qty: item.min_qty,
      unit_cost: item.unit_cost,
      supplier: item.supplier,
      location: item.location,
      is_active: item.is_active,
    });
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingItem) {
        await updateStockItem(editingItem.id, normalizeFormPayload(form));
        setSuccess("Artikulli u përditësua me sukses.");
      } else {
        await createStockItem(normalizeFormPayload(form));
        setSuccess("Artikulli u shtua me sukses.");
      }

      setEditingItem(null);
      setForm(emptyForm);
      await loadStock(filters, { keepMessages: true });
    } catch (apiError) {
      setError(apiError.message || "Ruajtja nuk u krye me sukses.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `A je i sigurt që dëshiron ta fshish artikullin "${item.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteStockItem(item.id);
      setSuccess("Artikulli u fshi me sukses.");
      await loadStock(filters, { keepMessages: true });
    } catch (apiError) {
      setError(apiError.message || "Fshirja nuk u krye me sukses.");
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Stoku</p>
          <h2>Menaxhimi i artikujve</h2>
        </div>
        <button className="secondary-button" type="button" onClick={() => loadStock()}>
          <RefreshCw size={18} />
          Rifresko
        </button>
      </header>

      <section className="summary-grid" aria-label="Përmbledhja e stokut">
        <article className="summary-card">
          <span>Artikuj total</span>
          <strong>{summary?.total_items ?? "--"}</strong>
        </article>
        <article className="summary-card">
          <span>Artikuj aktivë</span>
          <strong>{summary?.active_items ?? "--"}</strong>
        </article>
        <article className="summary-card warning">
          <span>Stok i ulët</span>
          <strong>{summary?.low_stock_items ?? "--"}</strong>
        </article>
        <article className="summary-card">
          <span>Vlera e stokut</span>
          <strong>{currency(summary?.total_inventory_value)}</strong>
        </article>
      </section>

      {lowStockItems.length > 0 ? (
        <section className="low-stock-band">
          <div>
            <AlertCircle size={22} />
            <div>
              <h3>Artikuj që duhen kontrolluar</h3>
              <p>
                {lowStockItems
                  .slice(0, 3)
                  .map((item) => `${item.name} (${item.current_qty}/${item.min_qty})`)
                  .join(", ")}
                {lowStockItems.length > 3 ? ` dhe ${lowStockItems.length - 3} tjerë` : ""}
              </p>
            </div>
          </div>
          <button
            className="text-button"
            type="button"
            onClick={showOnlyLowStock}
          >
            Shfaq vetëm low-stock
          </button>
        </section>
      ) : null}

      {(error || success) && (
        <div className={`alert ${error ? "alert-error" : "alert-success"}`}>
          {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {error || success}
        </div>
      )}

      <section className="stock-workspace">
        <div className="stock-list-panel">
          <div className="toolbar stock-filters">
            <label className="search-box">
              <Search size={18} />
              <input
                name="search"
                onChange={updateFilter}
                placeholder="Kërko sipas emrit, kodit ose furnitorit"
                type="search"
                value={filters.search}
              />
            </label>

            <select name="category" onChange={updateFilter} value={filters.category}>
              <option value="">Të gjitha kategoritë</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select name="sortBy" onChange={updateFilter} value={filters.sortBy}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Rendit: {option.label}
                </option>
              ))}
            </select>

            <select name="sortOrder" onChange={updateFilter} value={filters.sortOrder}>
              <option value="asc">Rritës</option>
              <option value="desc">Zbritës</option>
            </select>

            <label className="toggle-field">
              <input
                checked={filters.onlyLowStock}
                name="onlyLowStock"
                onChange={updateFilter}
                type="checkbox"
              />
              Vetëm low-stock
            </label>
          </div>

          <div className="table-wrap">
            {isLoading ? (
              <div className="state-panel">
                <div className="loader" />
                <p>Duke lexuar stokun...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="state-panel">
                <p>Nuk u gjet asnjë artikull me këto filtra.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kodi</th>
                    <th>Artikulli</th>
                    <th>Kategoria</th>
                    <th>Sasia</th>
                    <th>Minimumi</th>
                    <th>Çmimi</th>
                    <th>Lokacioni</th>
                    <th>Veprime</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className={item.is_low_stock ? "is-low" : ""}>
                      <td>{item.item_code}</td>
                      <td>
                        <strong>{item.name}</strong>
                        <span>{item.supplier}</span>
                      </td>
                      <td>{item.category}</td>
                      <td>{item.current_qty}</td>
                      <td>{item.min_qty}</td>
                      <td>{currency(item.unit_cost)}</td>
                      <td>{item.location}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => startEdit(item)}
                            title="Përditëso artikullin"
                            aria-label={`Përditëso ${item.name}`}
                          >
                            <Edit3 size={17} />
                          </button>
                          <button
                            className="icon-button danger"
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Fshi artikullin"
                            aria-label={`Fshi ${item.name}`}
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
              <p className="eyebrow">{editingItem ? "Përditësim" : "Artikull i ri"}</p>
              <h3>{editingItem ? editingItem.name : "Shto në stok"}</h3>
            </div>
            {editingItem ? (
              <button
                className="icon-button"
                type="button"
                onClick={startCreate}
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
              <span>Kodi</span>
              <input name="item_code" onChange={updateForm} required value={form.item_code} />
            </label>
            <label className="field">
              <span>Emri</span>
              <input name="name" onChange={updateForm} required value={form.name} />
            </label>
            <label className="field">
              <span>Kategoria</span>
              <input name="category" onChange={updateForm} value={form.category} />
            </label>
            <div className="form-row">
              <label className="field">
                <span>Njësia</span>
                <input name="unit" onChange={updateForm} value={form.unit} />
              </label>
              <label className="field">
                <span>Çmimi</span>
                <input
                  min="0"
                  name="unit_cost"
                  onChange={updateForm}
                  step="0.01"
                  type="number"
                  value={form.unit_cost}
                />
              </label>
            </div>
            <div className="form-row">
              <label className="field">
                <span>Sasia</span>
                <input
                  min="0"
                  name="current_qty"
                  onChange={updateForm}
                  type="number"
                  value={form.current_qty}
                />
              </label>
              <label className="field">
                <span>Minimumi</span>
                <input
                  min="0"
                  name="min_qty"
                  onChange={updateForm}
                  type="number"
                  value={form.min_qty}
                />
              </label>
            </div>
            <label className="field">
              <span>Furnitori</span>
              <input name="supplier" onChange={updateForm} value={form.supplier} />
            </label>
            <label className="field">
              <span>Lokacioni</span>
              <input name="location" onChange={updateForm} value={form.location} />
            </label>
            <label className="toggle-field form-toggle">
              <input
                checked={form.is_active}
                name="is_active"
                onChange={updateForm}
                type="checkbox"
              />
              Artikull aktiv
            </label>

            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Duke ruajtur..." : editingItem ? "Ruaj ndryshimet" : "Shto artikull"}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}

export default StockPage;
