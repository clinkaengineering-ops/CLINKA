import { EngineerProfilePage } from "@/features/users/components/EngineerProfilePage";

export default function Page({ params }: { params: { id: string } }) {
  return <EngineerProfilePage id={Number(params.id)} />;
}
