import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import WorkspaceClient from "./WorkspaceClient";

export default async function DocsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/auth/sign-in");

  return <WorkspaceClient />;
}
