import { useState } from "react";
import { Link } from "react-router-dom";
import { solicitarReset } from "@/lib/auth/actions";
import "@/styles/login.css";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    const resultado = await solicitarReset(new FormData(evento.currentTarget));
    setEnviando(false);

    if (resultado.error) {
      setError(resultado.error);
      return;
    }
    setEnviado(true);
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <span className="login-brand">Constructora Andes</span>
        <span className="login-tag">Recuperar contraseña</span>

        {enviado ? (
          <p className="login-hint">
            Si el correo existe, te enviamos un enlace para elegir una contraseña nueva. Revisa tu
            bandeja de entrada (y spam).
          </p>
        ) : (
          <form className="login-form" onSubmit={alEnviar}>
            {error && <p className="login-error">{error}</p>}

            <label className="login-field">
              Correo
              <input name="email" type="email" autoComplete="email" required />
            </label>

            <button type="submit" className="login-submit" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        )}

        <Link to="/login" className="login-back">
          ← Volver a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
