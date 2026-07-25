"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function solicitarReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/callback?next=/login/reset`,
  });

  if (error) {
    redirect(`/login/forgot?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login/forgot?enviado=1");
}
