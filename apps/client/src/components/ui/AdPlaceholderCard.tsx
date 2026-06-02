"use client";

import Link from "next/link";

type AdPlaceholderCardProps = {
  className?: string;
  placement?: number;
};

export function AdPlaceholderCard({
  className = "",
  placement = 1,
}: AdPlaceholderCardProps) {
  return (
    <Link
      href="/catalog"
      aria-label={`Открыть рекламную подборку ${placement}`}
      className={`group relative flex min-h-[250px] overflow-hidden rounded-[18px] bg-[#34150F] p-4 text-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(52,21,15,0.22)] sm:min-h-[360px] sm:rounded-[24px] sm:p-5 ${className}`}
    >
      <span className="absolute right-3 top-3 z-10 rounded-full bg-white/18 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/80 backdrop-blur sm:right-4 sm:top-4">
        Реклама
      </span>

      <div className="absolute inset-0 bg-[linear-gradient(145deg,#45180f_0%,#7a2417_42%,#d59022_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent_0%,rgba(20,8,5,0.82)_100%)]" />
      <div className="absolute -right-12 top-10 h-36 w-36 rotate-12 rounded-[28px] bg-[#F7C948]/90 shadow-[0_24px_55px_rgba(0,0,0,0.28)] transition group-hover:scale-105 sm:h-48 sm:w-48" />
      <div className="absolute right-5 top-20 h-24 w-28 rotate-12 rounded-[22px] bg-[#F9E0A0] shadow-inner sm:right-8 sm:top-28 sm:h-32 sm:w-40" />

      <div className="relative z-10 mt-auto">
        <div className="inline-flex rotate-[-3deg] rounded-md bg-[#1E3A8A] px-2.5 py-1 text-xl font-black italic leading-none text-white shadow-[0_8px_18px_rgba(0,0,0,0.2)] sm:text-3xl">
          SNICKERS
        </div>
        <p className="mt-4 max-w-[190px] text-2xl font-black leading-[0.95] tracking-[0] text-[#FFD166] sm:text-4xl">
          Голоден?
        </p>
        <p className="mt-1 max-w-[190px] text-2xl font-black leading-[0.95] tracking-[0] sm:text-4xl">
          Сникерсни
        </p>
      </div>
    </Link>
  );
}
