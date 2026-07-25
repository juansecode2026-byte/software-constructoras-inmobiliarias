import { actualizarPassword } from "./actions";
import "../login.css";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="login-page">
      <div className="login-card">
        <span className="login-brand">Constructora Andes</span>
        <span className="login-tag">Elegir nueva contraseña</span>

        <form className="login-form" action={actualizarPassword}>
          {error && <p className="login-error">{error}</p>}

          <label className="login-field">
            Nueva contraseña
            <input name="password" type="password" autoComplete="new-password" minLength={6} required />
          </label>

          <button type="submit" className="login-submit">
            Guardar y entrar
          </button>
        </form>
      </div>
    </main>
  );
}
