import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    redirect("/feed");
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      redirect("/feed");
    } else {
      redirect("/login");
    }
  } catch {
    redirect("/feed");
  }
}
