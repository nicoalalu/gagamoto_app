import { redirect } from "next/navigation";

type Params = { params: Promise<{ nombre: string }> };

export default async function RivalDetallePage({ params }: Params) {
  const { nombre } = await params;
  redirect(`/rivales?rival=${nombre}`);
}
