"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AtSign,
  Heart,
  LogOut,
  MapPin,
  Package,
  Pencil,
  ShoppingCart,
  Star,
  Store,
  User,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ADMIN_SELLER_URL } from "@/lib/admin";
import { logout, setUser } from "@/store/authSlice";
import { logoutClient, updateClientProfile } from "@/lib/auth-api";
import { fetchOrders, type ApiOrder } from "@/lib/order-api";
import { useAppSelector } from "@/store/hooks";
import { useAppDispatch } from "@/store/hooks";
import { hydrateCart } from "@/store/cartSlice";
import { hydrateCompare } from "@/store/compareSlice";
import { hydrateFavorites } from "@/store/favoritesSlice";
import { clearOrders } from "@/store/ordersSlice";
import { useLanguage } from "@/hooks/useLanguage";
import { AccountTab } from "./AccountTab";

export function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isSessionRestored = useAppSelector(
    (state) => state.auth.isSessionRestored,
  );
  const [activeTab, setActiveTab] = useState<"orders" | "account">("orders");
  const cartCount = useAppSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const favoritesCount = useAppSelector((state) => state.favorites.ids.length);
  const compareCount = useAppSelector((state) => state.compare.ids.length);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [completedOrders, setCompletedOrders] = useState<ApiOrder[]>([]);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Поддерживаются только изображения формата JPG, PNG или WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Размер файла не должен превышать 5 МБ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;

      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const MAX_SIZE = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);

        try {
          setIsUploadingAvatar(true);
          await updateClientProfile({ avatar: compressedBase64 });
          if (user) {
            dispatch(setUser({ ...user, avatar: compressedBase64 }));
          }
        } catch (err) {
          console.error("Failed to upload avatar", err);
          alert("Не удалось загрузить фото. Попробуйте позже.");
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isSessionRestored && !user) {
      router.push("/login");
    }
  }, [isSessionRestored, user, router]);

  useEffect(() => {
    let isMounted = true;

    function updateOrdersData() {
      if (!isSessionRestored || !user) {
        setActiveOrdersCount(0);
        setCompletedOrders([]);
        return;
      }

      fetchOrders()
        .then((data) => {
          if (isMounted) {
            setActiveOrdersCount(data.filter(isActiveOrder).length);
            setCompletedOrders(data.filter((o) => !isActiveOrder(o)));
          }
        })
        .catch(() => {
          if (isMounted) {
            setActiveOrdersCount(0);
            setCompletedOrders([]);
          }
        });
    }

    if (!isSessionRestored || !user) {
      setActiveOrdersCount(0);
      setCompletedOrders([]);
      return;
    }

    updateOrdersData();
    window.addEventListener("orders-updated", updateOrdersData);

    return () => {
      isMounted = false;
      window.removeEventListener("orders-updated", updateOrdersData);
    };
  }, [isSessionRestored, user]);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-[-0.04em] md:text-4xl">
          {t("profileTitle")}
        </h1>
        <p className="mt-2 text-[#6B7280]">{t("profileSubtitle")}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
        <aside className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col items-center text-center">
            <div className="group relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] text-white overflow-hidden shadow-inner">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={42} />
              )}
              {user && (
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isUploadingAvatar}
                  />
                  {isUploadingAvatar ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Camera size={24} className="text-white" />
                  )}
                </label>
              )}
            </div>
            <h3 className="mt-4 text-lg font-black text-[#111827]">
              {user ? user.name : "Гость"}
            </h3>
            {user && (
              <button
                onClick={() => setActiveTab(activeTab === "account" ? "orders" : "account")}
                className="mt-3 rounded-2xl bg-[#F6F7FB] px-5 py-2 text-sm font-bold text-[#111827] transition hover:bg-[#E5E7EB]"
              >
                {activeTab === "account" ? "Вернуться назад" : "Изменить профиль"}
              </button>
            )}
            {!user && (
              <p className="mt-2 text-sm text-[#6B7280]">
                {t("loginOrRegister")}
              </p>
            )}
          </div>
          <div className="mt-8 space-y-3">
            <ProfileButton
              icon={<ShoppingCart size={18} />}
              label={`${t("cart")} (${cartCount})`}
              href="/cart"
            />
            <ProfileButton
              icon={<Heart size={18} />}
              label={`${t("favorites")} (${favoritesCount})`}
              href="/favorites"
            />
            <ProfileButton
              icon={<Star size={18} />}
              label={`${t("compare")} (${compareCount})`}
              href="/compare"
            />
            <ProfileButton
              icon={<Package size={18} />}
              label={
                activeOrdersCount > 0
                  ? `${t("orderHistory")} (${activeOrdersCount})`
                  : t("orderHistory")
              }
              isActive={activeTab === "orders"}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("orders");
              }}
              href="/orders"
            />
            {user && (
              <a
                href={ADMIN_SELLER_URL}
                className="seller-profile-cta relative flex h-12 items-center justify-center gap-2 overflow-visible rounded-2xl border text-sm font-black transition"
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
                <Store size={18} /> {t("sellOnMarketAI")}
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
                  dispatch(hydrateCart([]));
                  dispatch(hydrateFavorites([]));
                  dispatch(hydrateCompare([]));
                  dispatch(clearOrders());
                  router.push("/login");
                }
              }}
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FEF2F2] text-sm font-bold text-[#EF4444] transition hover:bg-[#FEE2E2]"
            >
              <LogOut size={18} /> {t("logout")}
            </button>
          ) : (
            <Link
              href="/login"
              className="mt-8 flex h-12 w-full items-center justify-center rounded-2xl bg-[#6D4AFF] text-sm font-bold text-white transition hover:bg-[#4F32D9]"
            >
              {t("login")}
            </Link>
          )}
        </aside>

        <div className="space-y-6">
          {activeTab === "account" ? (
            <AccountTab />
          ) : (
            <>
              {user && !user.phone && (
                <div className="rounded-[32px] border border-[#D9CCFF] bg-gradient-to-r from-[#F6F2FF] to-[#EEF4FF] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-[560px]">
                      <p className="text-sm font-black uppercase tracking-[0.14em] text-[#6D4AFF]">
                        Контакты
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-[#111827]">
                        Добавьте телефон, чтобы быстрее оформлять заказы
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#4B5563]">
                        Заполните телефон во вкладке учетных данных, чтобы не вводить его заново при каждом заказе.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("account")}
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#6D4AFF] px-5 text-sm font-bold text-white transition hover:bg-[#4F32D9] dark:shadow-[0_12px_28px_rgba(109,74,255,0.24)]"
                    >
                      Добавить телефон
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{t("addressTitle")}</h3>
                    <p className="text-sm text-[#6B7280]">{t("addressSubtitle")}</p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-[#F6F7FB] p-5">
                  <p className="font-bold">{t("defaultAddress")}</p>
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
                    <h3 className="text-xl font-black">{t("orderHistoryTitle")}</h3>
                    <p className="text-sm text-[#6B7280]">
                      {t("orderHistorySubtitle")}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  {completedOrders.length === 0 ? (
                    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F6F7FB] p-6 text-center">
                      <Package size={34} className="text-[#6D4AFF]" />
                      <h4 className="mt-4 text-lg font-black">
                        {t("noOrdersYet")}
                      </h4>
                      <p className="mt-2 max-w-[360px] text-sm text-[#6B7280]">
                        {t("noOrdersMessage")}
                      </p>
                      <Link
                        href="/"
                        className="mt-5 rounded-2xl bg-[#6D4AFF] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4F32D9]"
                      >
                        {t("goToProducts")}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(showAllOrders ? completedOrders : completedOrders.slice(0, 5)).map((order) => {
                        const itemsCount = order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        );
                        const isCancelled =
                          order.status === "CANCELLED" ||
                          order.fulfillmentStatus === "CANCELLED";
                        const statusText = isCancelled ? "Отменен" : "Завершен";
                        const statusClass = isCancelled
                          ? "bg-[#FEF2F2] text-[#EF4444]"
                          : "bg-[#F1EDFF] text-[#6D4AFF]";

                        return (
                          <Link
                            href={`/orders/${order.publicId}`}
                            key={order.id}
                            className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] p-4 transition hover:border-[#6D4AFF]"
                          >
                            <div>
                              <p className="font-bold">
                                {t("orderId")}
                                {order.publicId}
                              </p>
                              <p className="mt-1 text-sm text-[#6B7280]">
                                {itemsCount} {t("itemsCountShort")} •{" "}
                                {order.grandTotal} ₽
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                            >
                              {statusText}
                            </span>
                          </Link>
                        );
                      })}
                      
                      {completedOrders.length > 5 && !showAllOrders && (
                        <button
                          type="button"
                          onClick={() => setShowAllOrders(true)}
                          className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-[#F6F7FB] text-sm font-bold text-[#111827] transition hover:bg-[#E5E7EB]"
                        >
                          Показать еще ({completedOrders.length - 5})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ProfileButton({
  icon,
  label,
  href,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-bold text-[#111827] transition hover:bg-[#F6F7FB] ${isActive ? "bg-[#F6F7FB]" : ""}`}
    >
      <div className="text-[#6D4AFF]">{icon}</div>
      {label}
    </Link>
  );
}

function formatRussianPhone(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }

  const localDigits = digits.slice(0, 10);
  const parts = [
    localDigits.slice(0, 3),
    localDigits.slice(3, 6),
    localDigits.slice(6, 8),
    localDigits.slice(8, 10),
  ];

  if (!localDigits) return "";

  let phone = `+7 (${parts[0]})`;
  if (parts[1]) phone += ` ${parts[1]}`;
  if (parts[2]) phone += `-${parts[2]}`;
  if (parts[3]) phone += `-${parts[3]}`;

  return phone;
}

function normalizeRussianPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.length === 10) {
    return `+7${digits}`;
  }

  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7${digits.slice(1)}`;
  }

  return null;
}

function isActiveOrder(order: ApiOrder) {
  const status = order.status.toLowerCase();
  const fulfillmentStatus = order.fulfillmentStatus.toLowerCase();

  return !(
    status.includes("cancel") ||
    status.includes("complete") ||
    fulfillmentStatus.includes("cancel") ||
    fulfillmentStatus.includes("received")
  );
}
