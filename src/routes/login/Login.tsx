import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/lib/auth/actions";
import { useAuth } from "@/lib/auth/AuthProvider";
import "@/styles/login.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { avisoSesion, limpiarAviso } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // El aviso de cierre por inactividad lo traia el proxy en ?error=; ahora vive
  // en el contexto de auth.
  const mensaje = error ?? avisoSesion;

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    limpiarAviso();

    const resultado = await login(new FormData(evento.currentTarget));

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
        <span className="login-tag">ERP a la medida</span>

        <form className="login-form" onSubmit={alEnviar}>
          {mensaje && <p className="login-error">{mensaje}</p>}

          <label className="login-field">
            Correo
            <input name="email" type="email" autoComplete="email" required />
          </label>

          <label className="login-field">
            Contraseña
            <input name="password" type="password" autoComplete="current-password" required />
          </label>

          <button type="submit" className="login-submit" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <Link to="/login/forgot" className="login-back">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </main>
  );
}
