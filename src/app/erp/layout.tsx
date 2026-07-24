import type { Metadata } from "next";
import { ErpShell } from "@/features/erp/ErpShell";
import "./erp.css";

export const metadata: Metadata = {
  title: "Constructora Andes — ERP a la medida",
  description: "ERP para una constructora con varios proyectos propios: costos, presupuesto y agentes de IA.",
};

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return <ErpShell>{children}</ErpShell>;
}
