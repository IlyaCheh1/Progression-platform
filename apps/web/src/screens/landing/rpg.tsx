export default function RpgBlock() {
  const items = [
    { t: "Тренируешься", d: "Подтверждённое посещение создаёт факт для наград." },
    { t: "Получаешь опыт", d: "Reward Engine начисляет XP идемпотентно, без дублей." },
    { t: "Прокачиваешь персонажа", d: "Level 1–100 и восемь оружейных путей мастерства." },
    { t: "Открываешь достижения", d: "Тиры, печати рангов, квесты и титулы зала." },
  ];

  return (
    <section id="rpg" className="border-y border-mos-line/30 bg-mos-stone/30 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl tracking-[0.12em] text-mos-amber">RPG-персонаж</h2>
        <p className="mt-2 max-w-2xl text-mos-muted">
          Логика прогрессии как в игре — но опыт приходит из реального зала, а не из внутренней валюты.
        </p>
        <ol className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((it, i) => (
            <li key={it.t} className="border border-mos-line/40 bg-mos-bg/50 p-5">
              <span className="font-display text-mos-amber">0{i + 1}</span>
              <h3 className="mt-2 font-display text-xl text-mos-text">{it.t}</h3>
              <p className="mt-2 text-sm text-mos-muted">{it.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
