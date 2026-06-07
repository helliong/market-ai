import { Header } from "@/components/layout/Header";
import { StoreUnavailableState } from "@/components/not-found/StoreUnavailableState";
import { StorePage } from "@/components/store/StorePage";
import { getPublicStoreProfile } from "@/lib/auth-api";
import { findStoreNameBySlug } from "@/lib/stores";

type StoreRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function StoreRoute({ params }: StoreRouteProps) {
  const { slug } = await params;
  const storeName = await findStoreNameBySlug(slug);

  if (!storeName) {
    return (
      <main>
        <Header />
        <StoreUnavailableState />
      </main>
    );
  }

  const storeProfile = await getPublicStoreProfile(storeName).catch(() => null);

  return (
    <main>
      <Header />
      <StorePage storeName={storeName} storeProfile={storeProfile} />
    </main>
  );
}
