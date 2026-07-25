"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function actualizarPassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/login/reset?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/erp");
}
