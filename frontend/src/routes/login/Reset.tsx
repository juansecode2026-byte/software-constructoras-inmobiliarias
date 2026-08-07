import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { actualizarPassword } from "@/lib/auth/actions";
import "@/styles/login.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    const resultado = await actualizarPassword(new FormData(evento.currentTarget));

    if (resultado.error) {
      setError(resultado.error);
      setEnviando(false);
      return;
    }

    navigate("/erp", { replace: true });
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <span className="login-brand">Constructora Andes</span>
        <span className="login-tag">Elegir nueva contraseña</span>

        <form className="login-form" onSubmit={alEnviar}>
          {error && <p className="login-error">{error}</p>}

          <label className="login-field">
            Nueva contraseña
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          <button type="submit" className="login-submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar y entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
