import type { Metadata } from "next";
import { ErpShell } from "@/features/erp/ErpShell";
import { createClient } from "@/lib/supabase/server";
import "./erp.css";

export const metadata: Metadata = {
  title: "Constructora Andes — ERP a la medida",
  description: "ERP para una constructora con varios proyectos propios: costos, presupuesto y agentes de IA.",
};

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <ErpShell userEmail={user?.email ?? "—"}>{children}</ErpShell>;
}
