import { Link } from "react-router-dom";

const features = [
  {
    title: "Presupuesto y control de costos",
    description: "Área, partida y recurso con análisis de precio unitario — el mismo peso decimal que un presupuesto de obra real, no una hoja de cálculo.",
  },
  {
    title: "Varios proyectos, una sola empresa",
    description: "Miramar, Los Aromos, Vista Norte: cada obra propia con su propio avance y presupuesto, todo en un solo lugar.",
  },
  {
    title: "Agentes de IA",
    description: "Buscan mejores precios de proveedores, sugieren el precio de venta según el costo real, y detectan riesgos antes de que escalen.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <header className="flex items-center justify-between rounded-full border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <div>
            <p className="text-lg font-semibold text-slate-900">Constructora Andes</p>
            <p className="text-sm text-slate-500">ERP a la medida</p>
          </div>
          <Link
            to="/erp"
            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
          >
            Ingresar
          </Link>
        </header>

        <section className="grid items-center gap-8 rounded-3xl bg-slate-950 px-6 py-12 text-white shadow-2xl sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-16 lg:py-20">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-teal-400/30 bg-teal-500/10 px-3 py-1 text-sm text-teal-200">
              ERP a la medida para constructoras e inmobiliarias
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Controla cada proyecto de punta a punta, con decisiones más rápidas y más inteligentes.
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                Presupuesto, obra y proyectos propios en una sola plataforma, con agentes de IA que
                buscan mejores precios y sugieren decisiones antes de que tengas que pedirlas.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/erp"
                className="rounded-full bg-white px-5 py-3 text-center font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Ingresar al sistema
              </Link>
              <a
                href="#funciones"
                className="rounded-full border border-slate-700 px-5 py-3 text-center font-medium text-slate-100 transition hover:bg-slate-800"
              >
                Ver qué incluye
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-sm text-slate-400">Presupuesto de trabajo</p>
                <p className="mt-2 text-3xl font-semibold">$4.511.396</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">Ahorro sugerido por agente</p>
                  <p className="mt-2 text-2xl font-semibold">$402.600</p>
                </div>
                <div className="rounded-xl bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">Alertas de stock crítico</p>
                  <p className="mt-2 text-2xl font-semibold">3</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="funciones" className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
            </article>
          ))}
        </section>

        <section id="contacto" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">¿Ya tienes acceso?</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Este es el ERP privado de Constructora Andes. Si formas parte del equipo, entra con tu
                cuenta; si necesitas acceso o soporte, contáctanos.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/erp"
                className="rounded-full bg-teal-700 px-5 py-3 text-center font-medium text-white transition hover:bg-teal-800"
              >
                Ingresar
              </Link>
              <a
                href="mailto:soporte@constructora-andes.cl"
                className="rounded-full border border-slate-300 px-5 py-3 text-center font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Contactar soporte
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
