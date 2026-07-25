import Link from "next/link";
import { solicitarReset } from "./actions";
import "../login.css";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; enviado?: string }>;
}) {
  const { error, enviado } = await searchParams;

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
          <form className="login-form" action={solicitarReset}>
            {error && <p className="login-error">{error}</p>}

            <label className="login-field">
              Correo
              <input name="email" type="email" autoComplete="email" required />
            </label>

            <button type="submit" className="login-submit">
              Enviar enlace
            </button>
          </form>
        )}

        <Link href="/login" className="login-back">
          ← Volver a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
