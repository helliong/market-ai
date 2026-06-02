"use client";

import { useEffect, useState, type CSSProperties, type SyntheticEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BADGE_CORNER_CLASSES,
  findDarkestBadgeCorner,
  type BadgeCorner,
} from "@/lib/ad-badge-tone";

type AdPlaceholderCardProps = {
  className?: string;
  placement?: number;
};

type AdVariant = {
  brand: string;
  brandBg: string;
  headline: string;
  headlineColor: string;
  subline: string;
  cardBg: string;
  hoverShadow: string;
  gradient: string;
  overlay: string;
  decorPrimary: string;
  decorSecondary: string;
  imageSrc?: string;
  imageAlt?: string;
  /** Угол плашки для CSS-баннеров без картинки */
  badgeCorner?: BadgeCorner;
};

const AD_VARIANTS: AdVariant[] = [
  {
    brand: "SNICKERS",
    brandBg: "#1E3A8A",
    headline: "Голоден?",
    headlineColor: "#FFD166",
    subline: "Сникерсни",
    cardBg: "#34150F",
    hoverShadow: "rgba(52,21,15,0.22)",
    gradient: "linear-gradient(145deg,#45180f_0%,#7a2417_42%,#d59022_100%)",
    overlay: "rgba(20,8,5,0.82)",
    decorPrimary: "#F7C948",
    decorSecondary: "#F9E0A0",
    imageSrc: "/RTF-ad.png",
    imageAlt: "Реклама Snickers",
  },
  {
    brand: "HAIER",
    brandBg: "#FFFFFF",
    headline: "Открой",
    headlineColor: "#FFFFFF",
    subline: "счастье",
    cardBg: "#0F172A",
    hoverShadow: "rgba(15,23,42,0.28)",
    gradient: "linear-gradient(145deg,#0f172a_0%,#1e3a5f_45%,#38bdf8_100%)",
    overlay: "rgba(15,23,42,0.85)",
    decorPrimary: "#FFFFFF",
    decorSecondary: "#E0F2FE",
    imageSrc: "/HAIER-ad.png",
    imageAlt: "Реклама Haier",
  },
  {
    brand: "LAY'S",
    brandBg: "#FACC15",
    headline: "Нельзя",
    headlineColor: "#FEF08A",
    subline: "остановиться",
    cardBg: "#1E3A1A",
    hoverShadow: "rgba(30,58,26,0.28)",
    gradient: "linear-gradient(145deg,#1a3318_0%,#3d7a2e_42%,#f5c518_100%)",
    overlay: "rgba(12,28,10,0.82)",
    decorPrimary: "#FACC15",
    decorSecondary: "#FEF9C3",
    badgeCorner: "top-left",
  },
  {
    brand: "NESCAFÉ",
    brandBg: "#7C2D12",
    headline: "Утро",
    headlineColor: "#FDE68A",
    subline: "начинается здесь",
    cardBg: "#2C1810",
    hoverShadow: "rgba(44,24,16,0.28)",
    gradient: "linear-gradient(145deg,#1f120c_0%,#5c3a2a_40%,#c48a5a_100%)",
    overlay: "rgba(18,10,6,0.85)",
    decorPrimary: "#D4A574",
    decorSecondary: "#F5E6D3",
  },
];

function getAdVariant(placement: number): AdVariant {
  const index = (placement - 1) % AD_VARIANTS.length;
  return AD_VARIANTS[index] ?? AD_VARIANTS[0];
}

function AdBadge({
  corner,
  visible,
}: {
  corner: BadgeCorner;
  visible: boolean;
}) {
  return (
    <span
      className={`absolute z-10 rounded-full bg-white/18 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/80 backdrop-blur transition-opacity duration-200 ${BADGE_CORNER_CLASSES[corner]} ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      Реклама
    </span>
  );
}

export function AdPlaceholderCard({
  className = "",
  placement = 1,
}: AdPlaceholderCardProps) {
  const ad = getAdVariant(placement);
  const brandTextColor = ad.brandBg === "#FFFFFF" ? "#DC2626" : "#FFFFFF";
  const isImageAd = Boolean(ad.imageSrc);
  const defaultCorner: BadgeCorner = ad.badgeCorner ?? "top-right";
  const [badgeCorner, setBadgeCorner] = useState<BadgeCorner>(defaultCorner);
  const [badgeVisible, setBadgeVisible] = useState(!isImageAd);

  useEffect(() => {
    setBadgeCorner(ad.badgeCorner ?? "top-right");
    setBadgeVisible(!ad.imageSrc);
  }, [placement, ad.badgeCorner, ad.imageSrc]);

  function handleAdImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    const corner = findDarkestBadgeCorner(event.currentTarget);
    setBadgeCorner(corner);
    setBadgeVisible(true);
  }

  return (
    <Link
      href="/"
      aria-label={`Открыть рекламную подборку ${placement}: ${ad.brand}`}
      className={`group relative flex min-h-[250px] overflow-hidden rounded-[18px] text-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_var(--ad-hover-shadow)] sm:min-h-[360px] sm:rounded-[24px] ${
        isImageAd ? "p-0" : "p-4 sm:p-5"
      } ${className}`}
      style={
        {
          backgroundColor: ad.cardBg,
          "--ad-hover-shadow": ad.hoverShadow,
        } as CSSProperties & { "--ad-hover-shadow": string }
      }
    >
      <AdBadge corner={badgeCorner} visible={badgeVisible} />

      {isImageAd && ad.imageSrc ? (
        <Image
          src={ad.imageSrc}
          alt={ad.imageAlt ?? ad.brand}
          fill
          unoptimized
          sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          onLoad={handleAdImageLoad}
        />
      ) : (
        <>
          <div className="absolute inset-0" style={{ background: ad.gradient }} />
          <div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{
              background: `linear-gradient(180deg,transparent_0%,${ad.overlay}_100%)`,
            }}
          />
          <div
            className="absolute -right-12 top-10 h-36 w-36 rotate-12 rounded-[28px] shadow-[0_24px_55px_rgba(0,0,0,0.28)] transition group-hover:scale-105 sm:h-48 sm:w-48"
            style={{ backgroundColor: `${ad.decorPrimary}e6` }}
          />
          <div
            className="absolute right-5 top-20 h-24 w-28 rotate-12 rounded-[22px] shadow-inner sm:right-8 sm:top-28 sm:h-32 sm:w-40"
            style={{ backgroundColor: ad.decorSecondary }}
          />

          <div className="relative z-10 mt-auto">
            <div
              className="inline-flex rotate-[-3deg] rounded-md px-2.5 py-1 text-xl font-black italic leading-none shadow-[0_8px_18px_rgba(0,0,0,0.2)] sm:text-3xl"
              style={{ backgroundColor: ad.brandBg, color: brandTextColor }}
            >
              {ad.brand}
            </div>
            <p
              className="mt-4 max-w-[190px] text-2xl font-black leading-[0.95] tracking-[0] sm:text-4xl"
              style={{ color: ad.headlineColor }}
            >
              {ad.headline}
            </p>
            <p className="mt-1 max-w-[190px] text-2xl font-black leading-[0.95] tracking-[0] text-white sm:text-4xl">
              {ad.subline}
            </p>
          </div>
        </>
      )}
    </Link>
  );
}
