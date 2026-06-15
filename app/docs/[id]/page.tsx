import WorkspaceClient from "../WorkspaceClient";

export default async function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkspaceClient initialId={id} />;
}
