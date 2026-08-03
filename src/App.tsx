import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { RedirectIfAuth, RequireAuth } from "@/lib/auth/guards";

import Landing from "@/routes/Landing";
import Login from "@/routes/login/Login";
import Forgot from "@/routes/login/Forgot";
import Reset from "@/routes/login/Reset";

import ErpLayout from "@/routes/erp/ErpLayout";
import Inicio from "@/routes/erp/Inicio";
import Opciones from "@/routes/erp/Opciones";
import Empresa from "@/routes/erp/Empresa";
import Perfil from "@/routes/erp/Perfil";
import Personas from "@/routes/erp/Personas";
import PersonaDetalle from "@/routes/erp/PersonaDetalle";
import Recursos from "@/routes/erp/Recursos";

import Presupuesto from "@/routes/erp/Presupuesto";
import PresupuestoPartidas from "@/routes/erp/PresupuestoPartidas";
import PresupuestoInicioPartida from "@/routes/erp/PresupuestoInicioPartida";
import PresupuestoInformes from "@/routes/erp/PresupuestoInformes";
import PresupuestoDetalle from "@/routes/erp/PresupuestoDetalle";
import PresupuestoComparacion from "@/routes/erp/PresupuestoComparacion";
import PartidaDetalle from "@/routes/erp/PartidaDetalle";

import Compras from "@/routes/erp/Compras";
import ComprasSolicitudRecursos from "@/routes/erp/ComprasSolicitudRecursos";
import ComprasSolicitudRecursosDetalle from "@/routes/erp/ComprasSolicitudRecursosDetalle";
import ComprasSolicitudCotizacion from "@/routes/erp/ComprasSolicitudCotizacion";
import ComprasSolicitudCotizacionDetalle from "@/routes/erp/ComprasSolicitudCotizacionDetalle";
import ComprasOrdenCompra from "@/routes/erp/ComprasOrdenCompra";
import ComprasOrdenCompraDetalle from "@/routes/erp/ComprasOrdenCompraDetalle";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Con sesion activa estas dos mandan al ERP, como hacia el proxy. */}
          <Route element={<RedirectIfAuth />}>
            <Route path="/login" element={<Login />} />
            <Route path="/login/forgot" element={<Forgot />} />
          </Route>

          {/* Queda fuera del guard: al abrir el enlace del correo el usuario YA
              tiene sesion, y el guard lo sacaria de la pantalla. */}
          <Route path="/login/reset" element={<Reset />} />

          <Route element={<RequireAuth />}>
            <Route path="/erp" element={<ErpLayout />}>
              <Route index element={<Inicio />} />
              <Route path="opciones" element={<Opciones />} />
              <Route path="empresa" element={<Empresa />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="personas" element={<Personas />} />
              <Route path="personas/:id" element={<PersonaDetalle />} />
              <Route path="recursos" element={<Recursos />} />

              <Route path="presupuesto" element={<Presupuesto />} />
              <Route path="presupuesto/partidas" element={<PresupuestoPartidas />} />
              <Route path="presupuesto/inicio-partida" element={<PresupuestoInicioPartida />} />
              <Route path="presupuesto/informes" element={<PresupuestoInformes />} />
              <Route path="presupuesto/:id" element={<PresupuestoDetalle />} />
              <Route path="presupuesto/:id/comparacion" element={<PresupuestoComparacion />} />
              <Route path="presupuesto/:id/partida/:partidaId" element={<PartidaDetalle />} />

              <Route path="compras" element={<Compras />} />
              <Route path="compras/solicitud-recursos" element={<ComprasSolicitudRecursos />} />
              <Route
                path="compras/solicitud-recursos/:id"
                element={<ComprasSolicitudRecursosDetalle />}
              />
              <Route path="compras/solicitud-cotizacion" element={<ComprasSolicitudCotizacion />} />
              <Route
                path="compras/solicitud-cotizacion/:id"
                element={<ComprasSolicitudCotizacionDetalle />}
              />
              <Route path="compras/orden-compra" element={<ComprasOrdenCompra />} />
              <Route path="compras/orden-compra/:id" element={<ComprasOrdenCompraDetalle />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
