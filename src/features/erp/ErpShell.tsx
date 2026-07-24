"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { navegacion, proyectos } from "./data";

const THEME_KEY = "erp-theme";

interface ProyectoContexto {
  proyectoActivo: string;
  setProyectoActivo: (nombre: string) => void;
}

const ProyectoContext = createContext<ProyectoContexto | null>(null);

export function useProyecto() {
  const ctx = useContext(ProyectoContext);
  if (!ctx) throw new Error("useProyecto debe usarse dentro de ErpShell");
  return ctx;
}

export function ErpShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [proyectoActivo, setProyectoActivo] = useState(proyectos[0].nombre);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const guardado = localStorage.getItem(THEME_KEY);
    if (guardado === "dark") setTheme("dark");
  }, []);

  useEffect(() => {
    if (!menuAbierto) return;
    function cerrar(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener("click", cerrar);
    return () => document.removeEventListener("click", cerrar);
  }, [menuAbierto]);

  function alternarTema() {
    const siguiente = theme === "dark" ? "light" : "dark";
    setTheme(siguiente);
    localStorage.setItem(THEME_KEY, siguiente);
  }

  function esActivo(href: string) {
    if (href === "/erp") return pathname === "/erp";
    return pathname.startsWith(href);
  }

  return (
    <ProyectoContext.Provider value={{ proyectoActivo, setProyectoActivo }}>
    <div className="erp" data-theme={theme}>
      <aside className="erp-sidebar">
        <div className="erp-brand">
          <span className="erp-brand-mark" />
          <div>
            <span className="erp-brand-word">Constructora Andes</span>
            <span className="erp-brand-tag">ERP a la medida · preview</span>
          </div>
        </div>

        {navegacion.map((grupo) => (
          <div className="erp-navgroup" key={grupo.titulo}>
            <h4>{grupo.titulo}</h4>
            {grupo.items.map((item) =>
              item.href ? (
                <Link
                  key={item.nombre}
                  href={item.href}
                  className={`erp-navitem is-live${esActivo(item.href) ? " is-active" : ""}`}
                >
                  {item.nombre}
                </Link>
              ) : (
                <span key={item.nombre} className="erp-navitem">
                  {item.nombre}
                  <span className="soon">próx.</span>
                </span>
              ),
            )}
          </div>
        ))}

        <div className="erp-sidebar-foot">
          Estructura completa según diagnóstico · solo Inicio y Presupuesto tienen vista construida.
        </div>
      </aside>

      <div className="erp-main">
        <header className="erp-topbar">
          <div className="erp-tenant">
            <div className="erp-proj-switch" ref={menuRef}>
              <button
                type="button"
                className="erp-proj-btn"
                onClick={() => setMenuAbierto((v) => !v)}
              >
                <span>
                  <span className="erp-proj-eyebrow">Proyecto</span>
                  <span className="erp-proj-value">{proyectoActivo}</span>
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {menuAbierto && (
                <div className="erp-proj-menu">
                  {proyectos.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`erp-proj-opt${p.nombre === proyectoActivo ? " is-active" : ""}`}
                      onClick={() => {
                        setProyectoActivo(p.nombre);
                        setMenuAbierto(false);
                      }}
                    >
                      {p.nombre}
                      <span className="erp-proj-meta">
                        {p.avancePct !== null ? `${p.avancePct}% avance` : "en planificación"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span>
              Usuario <b>Juanse</b>
            </span>
            <span>
              Período <b>07/2026</b>
            </span>
          </div>

          <span className="erp-preview-badge">
            <span className="dot" />
            Vista previa — sin datos ni backend reales
          </span>

          <button
            type="button"
            className="erp-theme-toggle"
            onClick={alternarTema}
            aria-label={theme === "dark" ? "Cambiar a modo día" : "Cambiar a modo noche"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            )}
            {theme === "dark" ? "Modo día" : "Modo noche"}
          </button>
        </header>

        {children}
      </div>
    </div>
    </ProyectoContext.Provider>
  );
}
