import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { StorePage } from "@/components/store/StorePage";
import { findStoreNameBySlug } from "@/lib/stores";

type StoreRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function StoreRoute({ params }: StoreRouteProps) {
  const { slug } = await params;
  const storeName = findStoreNameBySlug(slug);

  if (!storeName) {
    notFound();
  }

  return (
    <main>
      <Header />
      <StorePage storeName={storeName} />
    </main>
  );
}
