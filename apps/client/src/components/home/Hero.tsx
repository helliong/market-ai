"use client";

import { Bot, Sparkles, Search, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

// Главный промо-блок витрины с быстрым переходом к каталогу и AI-подбору.
export function Hero() {
  const { t } = useLanguage();
  function openAIWidget() { window.dispatchEvent(new Event("open-ai-widget")); }
  function openCatalog() { window.dispatchEvent(new Event("open-catalog")); }

  return (
    <section className="mx-auto mt-6 grid max-w-[1440px] grid-cols-1 gap-5 px-4 md:mt-8 md:gap-8 md:px-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[28px] bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] p-6 text-white shadow-[0_24px_70px_rgba(79,50,217,0.25)] md:rounded-[32px] md:p-12">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium"><Sparkles size={16} /> {t("aiAssistant")}</div>
        <h1 className="max-w-[650px] text-4xl font-black leading-[1.08] tracking-[-0.04em] md:text-6xl">{t("buyFasterWithAI")} <span className="underline">{t("mark")}</span></h1>
        <p className="mt-6 max-w-[560px] text-lg leading-8 text-white/80">{t("describeWhatYouNeed")}</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <button type="button" onClick={openAIWidget} className="hero-ai-button flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-7 text-base font-bold text-[#4F32D9] transition hover:scale-[1.02]"><Bot size={20} /> {t("askMark")}</button>
          <button type="button" onClick={openCatalog} className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/25 px-7 text-base font-bold text-white transition hover:bg-white/10"><Search size={20} /> {t("goToCatalog")}</button>
        </div>
      </div>

      <div className="relative hidden overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] md:rounded-[32px] md:p-10 lg:block">
        <div className="absolute right-5 top-5 rounded-2xl bg-[#F1EDFF] px-4 py-2 text-sm font-bold text-[#6D4AFF] md:right-8 md:top-8">{t("aiPick")}</div>
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#6D4AFF] text-white"><Bot size={42} /></div>
            <h2 className="mt-8 text-2xl font-black tracking-[-0.03em] md:text-3xl">{t("whatAreWeLookingFor")}</h2>
            <p className="mt-3 max-w-[420px] text-[#6B7280]">{t("tryQuery")}</p>
          </div>
          <div className="mt-10 space-y-4">
            {[t("smartphoneGoodCamera"), t("laptopForStudy"), t("giftUpTo3000")].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4"><span className="font-medium">{item}</span><ShoppingBag size={18} className="text-[#6D4AFF]" /></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
