const features = [
  {
    title: "Pipeline inteligente",
    description: "Gestiona leads, propiedades y seguimiento comercial en un tablero claro y accionable.",
  },
  {
    title: "Analítica en tiempo real",
    description: "Monitorea conversiones, flujo de caja y rendimiento por país, moneda y proyecto.",
  },
  {
    title: "Agentes de IA",
    description: "Automatiza respuestas, clasifica documentos y detecta riesgos antes de que escalen.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <header className="flex items-center justify-between rounded-full border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <div>
            <p className="text-lg font-semibold text-slate-900">CRM Mobiliaria</p>
            <p className="text-sm text-slate-500">Inteligencia para vender y operar mejor</p>
          </div>
          <a
            href="#contacto"
            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
          >
            Solicitar demo
          </a>
        </header>

        <section className="grid items-center gap-8 rounded-3xl bg-slate-950 px-6 py-12 text-white shadow-2xl sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-16 lg:py-20">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-teal-400/30 bg-teal-500/10 px-3 py-1 text-sm text-teal-200">
              Software vertical para constructoras e inmobiliarias
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Convierte cada oportunidad en una decisión más rápida y más inteligente.
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                Centraliza ventas, obra, finanzas y documentos en una sola plataforma con agentes de IA que apoyan a tus equipos.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#contacto"
                className="rounded-full bg-white px-5 py-3 text-center font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Ver demo
              </a>
              <a
                href="#funciones"
                className="rounded-full border border-slate-700 px-5 py-3 text-center font-medium text-slate-100 transition hover:bg-slate-800"
              >
                Explorar funciones
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-sm text-slate-400">Pipeline activo</p>
                <p className="mt-2 text-3xl font-semibold">184 oportunidades</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">Tasa de conversión</p>
                  <p className="mt-2 text-2xl font-semibold">+18%</p>
                </div>
                <div className="rounded-xl bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">Tiempo de respuesta</p>
                  <p className="mt-2 text-2xl font-semibold">-42%</p>
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
              <h2 className="text-2xl font-semibold text-slate-900">Listo para implementar tu copiloto inmobiliario</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Diseñamos una plataforma que combina datos, automatización y agentes de IA para acelerar ventas y operaciones.
              </p>
            </div>
            <a
              href="mailto:hola@crmmobiliaria.com"
              className="rounded-full bg-teal-700 px-5 py-3 text-center font-medium text-white transition hover:bg-teal-800"
            >
              hablar con el equipo
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
