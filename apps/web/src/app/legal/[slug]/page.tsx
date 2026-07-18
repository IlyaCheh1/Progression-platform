import Link from "next/link";

const DOCS: Record<string, { title: string; body: string[] }> = {
  offer: {
    title: "Публичная оферта",
    body: [
      "Настоящий документ определяет условия оказания услуг школы фехтования Master of Sword и доступа к Progression Platform.",
      "Пробное занятие, абонементы (месяц / 3 месяца / 6 месяцев) и индивидуальные занятия оформляются как Offer/Order в School Commerce.",
      "Оплата принимается через выбранного платёжного провайдера; карточные данные платформой не хранятся.",
    ],
  },
  terms: {
    title: "Пользовательское соглашение",
    body: [
      "Пользователь обязуется соблюдать правила безопасности зала и не передавать доступ к аккаунту третьим лицам.",
      "Character, Progression и Mastery являются данными платформы; школьное membership и CRM не хранятся в Character aggregate.",
      "Запрещены действия, нарушающие tenant isolation, replay-атаки на награды и обход подтверждения тренера.",
    ],
  },
  privacy: {
    title: "Политика конфиденциальности",
    body: [
      "Обрабатываются данные, необходимые для записи на занятия, прогрессии и связи с опекуном несовершеннолетнего.",
      "Профиль несовершеннолетнего по умолчанию private; публичные лидерборды отключены.",
      "Restricted данные (медицина, платёжные инструменты, контакты опекуна) не публикуются в общих Events и логах.",
    ],
  },
  cookies: {
    title: "Политика cookies",
    body: [
      "Используются необходимые cookies сессии OnlyID (HttpOnly) и локальные preference cookies интерфейса.",
      "Аналитические cookies включаются только после согласия, где это требуется.",
      "Вы можете удалить локальные данные демо-сессии через настройки браузера или выход из аккаунта.",
    ],
  },
};

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = DOCS[slug] ?? { title: "Документ", body: ["Документ не найден."] };
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/" className="text-sm text-mos-amber">
        ← На главную
      </Link>
      <h1 className="mt-6 font-display text-3xl text-mos-text">{doc.title}</h1>
      <div className="mos-line my-6" />
      {doc.body.map((p) => (
        <p key={p} className="mb-4 text-mos-muted">
          {p}
        </p>
      ))}
    </main>
  );
}
