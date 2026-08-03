import { useCallback, useEffect, useState } from "react";

interface EstadoAsync<T> {
  datos: T | null;
  cargando: boolean;
  error: Error | null;
  /** Vuelve a ejecutar la consulta; se usa despues de guardar. */
  recargar: () => void;
}

// Reemplaza al `await` que hacian los Server Components de Next: la consulta se
// dispara en el cliente y la pantalla muestra un estado de carga mientras tanto.
export function useAsync<T>(consulta: () => Promise<T>, deps: unknown[] = []): EstadoAsync<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  // La consulta se re-crea en cada render, por eso las dependencias reales son
  // las que declara quien llama al hook, no la funcion en si.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ejecutar = useCallback(consulta, deps);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    ejecutar()
      .then((resultado) => {
        if (activo) setDatos(resultado);
      })
      .catch((e) => {
        if (activo) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [ejecutar, version]);

  return { datos, cargando, error, recargar: () => setVersion((v) => v + 1) };
}

export function PantallaCargando({ texto = "Cargando…" }: { texto?: string }) {
  return <div className="p-8 text-sm text-slate-500">{texto}</div>;
}

export function PantallaError({ error }: { error: Error }) {
  return (
    <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      No se pudieron cargar los datos: {error.message}
    </div>
  );
}
