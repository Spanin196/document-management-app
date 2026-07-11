import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import WorkspaceClient from "../WorkspaceClient";

export default async function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/auth/sign-in");

  const { id } = await params;
  return <WorkspaceClient initialId={id} />;
}
