import { Link, useParams } from "react-router-dom";
import { nombrePersona, obtenerPersonaDetalle, rolesPersona } from "@/lib/supabase/configuraciones";
import { useAsync, PantallaCargando, PantallaError } from "@/hooks/useAsync";

const OPCION_PAGO_LABEL: Record<string, string> = {
  cheque: "Cheque",
  transferencia: "Transferencia electrónica",
  efectivo: "Efectivo",
};

export default function PersonaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { datos: persona, cargando, error } = useAsync(
    () => obtenerPersonaDetalle(id!),
    [id],
  );

  if (cargando) return <PantallaCargando />;
  if (error) return <PantallaError error={error} />;
  if (!persona) return null;

  const contactos = persona.direcciones.flatMap((d) =>
    d.contactos.map((c) => ({ ...c, sucursal: d.nombre ?? (d.tipo === "principal" ? "Principal" : "Sucursal") })),
  );

  return (
    <div className="erp-view">
      <div className="erp-view-head">
        <div>
          <h1>{nombrePersona(persona)}</h1>
          <span className="erp-crumb">
            <Link to="/erp/personas">Personas</Link> › {persona.identificador}
          </span>
        </div>
      </div>

      <div className="erp-toolbar">
        <button type="button" className="erp-btn ghost">Editar</button>
        <button type="button" className="erp-btn" disabled>Grabar</button>
      </div>

      <div className="erp-panel erp-persona-head">
        <div className="erp-panel-body">
          <div className="erp-roles-row">
            {rolesPersona(persona).map((rol) => (
              <span key={rol} className="erp-pill aprobado erp-rol">{rol}</span>
            ))}
            {!persona.vigente && <span className="erp-pill plan">No vigente</span>}
          </div>
          <div className="erp-dato-grid">
            <div className="erp-dato">
              <span className="label">Tipo de persona</span>
              <span className="valor">{persona.tipo_persona === "empresa" ? "Empresa" : "Persona natural"}</span>
            </div>
            <div className="erp-dato">
              <span className="label">RUT / Identificador</span>
              <span className="valor mono">{persona.identificador}</span>
            </div>
            {persona.tipo_persona === "empresa" ? (
              <>
                <div className="erp-dato">
                  <span className="label">Razón social</span>
                  <span className="valor">{persona.nombre_legal ?? "—"}</span>
                </div>
                <div className="erp-dato">
                  <span className="label">Nombre fantasía</span>
                  <span className="valor">{persona.nombre_comercial ?? "—"}</span>
                </div>
              </>
            ) : (
              <div className="erp-dato">
                <span className="label">Nombre completo</span>
                <span className="valor">{nombrePersona(persona)}</span>
              </div>
            )}
            <div className="erp-dato">
              <span className="label">Giro</span>
              <span className="valor">{persona.giro ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {persona.es_proveedor && (
        <div className="erp-panel erp-subpanel">
          <div className="erp-panel-head"><h3>Datos de proveedor</h3></div>
          <div className="erp-panel-body erp-dato-grid">
            <div className="erp-dato">
              <span className="label">Forma de pago</span>
              <span className="valor">
                {persona.forma_pago
                  ? `${persona.forma_pago.nombre}${persona.forma_pago.dias_vence > 0 ? ` (${persona.forma_pago.dias_vence} días)` : ""}`
                  : "—"}
              </span>
            </div>
            <div className="erp-dato">
              <span className="label">Opción de pago</span>
              <span className="valor">{OPCION_PAGO_LABEL[persona.opcion_pago ?? ""] ?? "—"}</span>
            </div>
            <div className="erp-dato">
              <span className="label">Representante legal</span>
              <span className="valor">{persona.representante_legal_nombre ?? "—"}</span>
            </div>
            <div className="erp-dato">
              <span className="label">RUT del representante</span>
              <span className="valor mono">{persona.representante_legal_identificador ?? "—"}</span>
            </div>
          </div>
        </div>
      )}

      <div className="erp-panel erp-subpanel">
        <div className="erp-panel-head"><h3>Direcciones</h3></div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr><th>Tipo</th><th>Nombre</th><th>Dirección</th><th>Comuna</th><th>Región</th><th>Teléfono</th></tr>
            </thead>
            <tbody>
              {persona.direcciones.map((d) => (
                <tr key={d.id}>
                  <td>{d.tipo === "principal" ? "Principal" : "Sucursal"}</td>
                  <td>{d.nombre ?? "—"}</td>
                  <td>{d.direccion}</td>
                  <td>{d.comuna ?? "—"}</td>
                  <td>{d.region ?? "—"}</td>
                  <td className="mono">{d.telefono ?? "—"}</td>
                </tr>
              ))}
              {persona.direcciones.length === 0 && (
                <tr><td colSpan={6} className="erp-empty">Sin direcciones registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="erp-panel erp-subpanel">
        <div className="erp-panel-head"><h3>Contactos</h3></div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr><th>Contacto</th><th>Sucursal</th><th>Cargo</th><th>Celular</th><th>Email</th></tr>
            </thead>
            <tbody>
              {contactos.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td>{c.sucursal}</td>
                  <td>{c.cargo ?? "—"}</td>
                  <td className="mono">{c.celular ?? c.telefono ?? "—"}</td>
                  <td>{c.email ?? "—"}</td>
                </tr>
              ))}
              {contactos.length === 0 && (
                <tr><td colSpan={5} className="erp-empty">Sin contactos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="erp-panel erp-subpanel">
        <div className="erp-panel-head"><h3>Cuentas bancarias</h3></div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr><th>Banco</th><th>Tipo de cuenta</th><th>N° cuenta</th><th>Moneda</th></tr>
            </thead>
            <tbody>
              {persona.datos_bancarios.map((b) => (
                <tr key={b.id}>
                  <td>{b.banco}</td>
                  <td>{b.tipo_cuenta === "corriente" ? "Cuenta corriente" : b.tipo_cuenta}</td>
                  <td className="mono">{b.numero_cuenta}</td>
                  <td className="mono">{b.moneda}</td>
                </tr>
              ))}
              {persona.datos_bancarios.length === 0 && (
                <tr><td colSpan={4} className="erp-empty">Sin cuentas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="erp-panel erp-subpanel">
        <div className="erp-panel-head"><h3>Adjuntos</h3></div>
        <div className="erp-table-wrap">
          <table>
            <thead>
              <tr><th>Archivo</th><th>Tipo</th></tr>
            </thead>
            <tbody>
              {persona.archivos.map((a) => (
                <tr key={a.id}>
                  <td>{a.nombre}</td>
                  <td>{a.tipo ?? "—"}</td>
                </tr>
              ))}
              {persona.archivos.length === 0 && (
                <tr><td colSpan={2} className="erp-empty">Sin archivos adjuntos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
