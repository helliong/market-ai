"use client";

import {
  Heart,
  LogOut,
  MapPin,
  Package,
  ShoppingCart,
  Star,
  Store,
  User,
} from "lucide-react";
import Link from "next/link";
import { ADMIN_REGISTER_URL } from "@/lib/admin";
import { logout } from "@/store/authSlice";
import { logoutClient } from "@/lib/auth-api";
import { useAppSelector } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const cartCount = useAppSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  const favoritesCount = useAppSelector((state) => state.favorites.ids.length);
  const compareCount = useAppSelector((state) => state.compare.ids.length);

  const orders: {
    id: number;
    itemsCount: number;
    total: string;
    status: string;
  }[] = [];

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-[-0.04em] md:text-4xl">
          Профиль
        </h1>
        <p className="mt-2 text-[#6B7280]">Управление аккаунтом и заказами</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
        <aside className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] text-white">
              <User size={42} />
            </div>

            <h2 className="mt-5 text-2xl font-black">
              {user?.name || "Гость"}
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              {user ? user.email : "Войдите, чтобы управлять аккаунтом"}
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <ProfileButton
              icon={<ShoppingCart size={18} />}
              label={`Корзина (${cartCount})`}
              href="/cart"
            />

            <ProfileButton
              icon={<Heart size={18} />}
              label={`Избранное (${favoritesCount})`}
              href="/favorites"
            />

            <ProfileButton
              icon={<Star size={18} />}
              label={`Сравнение (${compareCount})`}
              href="/compare"
            />

            {user && (
              <a
                href={ADMIN_REGISTER_URL}
                className="seller-profile-cta relative flex h-12 items-center justify-center gap-2 overflow-visible rounded-2xl border border-[#6D4AFF] bg-white text-sm font-black text-[#6D4AFF] transition hover:bg-[#F4F0FF] hover:text-[#4F32D9]"
              >
                <span
                  className="seller-profile-cta-star seller-profile-cta-star-1"
                  aria-hidden="true"
                />
                <span
                  className="seller-profile-cta-star seller-profile-cta-star-2"
                  aria-hidden="true"
                />
                <span
                  className="seller-profile-cta-star seller-profile-cta-star-3"
                  aria-hidden="true"
                />
                <span
                  className="seller-profile-cta-star seller-profile-cta-star-4"
                  aria-hidden="true"
                />
                <Store size={18} />
                Продавайте на MarketAI
              </a>
            )}
          </div>

          {user ? (
            <button
              onClick={async () => {
                try {
                  await logoutClient();
                } finally {
                  dispatch(logout());
                }
              }}
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FEF2F2] text-sm font-bold text-[#EF4444] transition hover:bg-[#FEE2E2]"
            >
              <LogOut size={18} />
              Выйти
            </button>
          ) : (
            <Link
              href="/login"
              className="mt-8 flex h-12 w-full items-center justify-center rounded-2xl bg-[#6D4AFF] text-sm font-bold text-white transition hover:bg-[#4F32D9]"
            >
              Войти
            </Link>
          )}
        </aside>

        <div className="space-y-6">
          <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]">
                <MapPin size={24} />
              </div>

              <div>
                <h3 className="text-xl font-black">Адрес доставки</h3>
                <p className="text-sm text-[#6B7280]">
                  Основной адрес пользователя
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-[#F6F7FB] p-5">
              <p className="font-bold">г. Екатеринбург</p>
              <p className="mt-2 text-sm text-[#6B7280]">
                ул. Примерная, д. 10
              </p>
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]">
                <Package size={24} />
              </div>

              <div>
                <h3 className="text-xl font-black">История заказов</h3>
                <p className="text-sm text-[#6B7280]">
                  Последние покупки пользователя
                </p>
              </div>
            </div>

            <div className="mt-6">
              {orders.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F6F7FB] p-6 text-center">
                  <Package size={34} className="text-[#6D4AFF]" />

                  <h4 className="mt-4 text-lg font-black">
                    Сделайте первый заказ
                  </h4>

                  <p className="mt-2 max-w-[360px] text-sm text-[#6B7280]">
                    Добавьте товары в корзину и оформите покупку — после этого
                    заказ появится здесь.
                  </p>

                  <Link
                    href="/"
                    className="mt-5 rounded-2xl bg-[#6D4AFF] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4F32D9]"
                  >
                    Перейти к товарам
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] p-4"
                    >
                      <div>
                        <p className="font-bold">Заказ #{order.id}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {order.itemsCount} товара • {order.total}
                        </p>
                      </div>

                      <span className="rounded-full bg-[#F1EDFF] px-3 py-1 text-xs font-bold text-[#6D4AFF]">
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileButton({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-bold text-[#111827] transition hover:bg-[#F6F7FB]"
    >
      <div className="text-[#6D4AFF]">{icon}</div>
      {label}
    </Link>
  );
}
