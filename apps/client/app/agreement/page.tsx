import { Header } from "@/components/layout/Header";

const sections = [
  {
    title: "1. Общие положения",
    text: "Настоящее пользовательское соглашение описывает базовые правила использования MarketAI. Сервис предоставляет интерфейс маркетплейса, подборки товаров и клиентские функции аккаунта.",
  },
  {
    title: "2. Аккаунт пользователя",
    text: "Пользователь отвечает за корректность данных, указанных при регистрации. Текущая версия регистрации работает без серверной проверки и будет дополнена backend-логикой позже.",
  },
  {
    title: "3. Покупки и товары",
    text: "Информация о товарах, ценах, избранном, сравнении и корзине используется для демонстрации пользовательского сценария и может быть расширена при подключении реального каталога.",
  },
  {
    title: "4. ИИ-помощник",
    text: "ИИ-помощник помогает с выбором товаров и не является окончательным источником условий покупки, гарантии или доставки.",
  },
  {
    title: "5. Изменение условий",
    text: "MarketAI может обновлять условия соглашения при развитии продукта, добавлении backend-сервисов и новых пользовательских возможностей.",
  },
];

export default function Agreement() {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-[980px] px-4 py-8 md:px-8 md:py-10">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:rounded-[32px] md:p-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#6D4AFF]">
            MarketAI
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-4xl">
            Пользовательское соглашение
          </h1>
          <p className="mt-4 leading-7 text-[#6B7280]">
            Документ фиксирует основные правила использования сервиса. Сейчас
            это фронтенд-версия соглашения для клиентского интерфейса.
          </p>

          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-black text-[#111827]">
                  {section.title}
                </h2>
                <p className="mt-3 leading-7 text-[#6B7280]">{section.text}</p>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
