import { Boxes, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();
  const [form, setForm] = useState({
    email: "admin@test.local",
    password: "test1234",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (apiError) {
      setError(apiError.message || "Login dështoi. Kontrollo të dhënat.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-copy">
          <div className="brand-block">
            <div className="brand-mark">
              <Boxes size={24} />
            </div>
            <div>
              <p className="eyebrow">Truck Service Management</p>
              <h1 id="login-title">Hyrje për administratorin</h1>
            </div>
          </div>
          <p>
            Menaxho stokun e servisit, shiko artikujt me sasi të ulët dhe mbaj
            të dhënat gati për punën e përditshme.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error ? <div className="alert alert-error">{error}</div> : null}

          <label className="field">
            <span>Email</span>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                autoComplete="email"
                name="email"
                onChange={updateField}
                required
                type="email"
                value={form.email}
              />
            </div>
          </label>

          <label className="field">
            <span>Fjalëkalimi</span>
            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                autoComplete="current-password"
                name="password"
                onChange={updateField}
                required
                type="password"
                value={form.password}
              />
            </div>
          </label>

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Duke hyrë..." : "Hyr në sistem"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
