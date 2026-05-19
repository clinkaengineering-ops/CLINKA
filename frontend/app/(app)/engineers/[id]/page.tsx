import { EngineerProfilePage } from "@/features/engineers/components/EngineerProfilePage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EngineerProfilePage id={Number(id)} />;
}