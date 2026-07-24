import { login } from "./actions";
import "./login.css";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="login-page">
      <div className="login-card">
        <span className="login-brand">Constructora Andes</span>
        <span className="login-tag">ERP a la medida</span>

        <form className="login-form" action={login}>
          {error && <p className="login-error">{error}</p>}

          <label className="login-field">
            Correo
            <input name="email" type="email" autoComplete="email" required />
          </label>

          <label className="login-field">
            Contraseña
            <input name="password" type="password" autoComplete="current-password" required />
          </label>

          <button type="submit" className="login-submit">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
