"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { markProfileCreated } from "@/lib/session";

const SKINS = [
  { id: "novice", label: "Новобранец" },
  { id: "scholar", label: "Ученик трактата" },
  { id: "duelist", label: "Дуэлянт" },
  { id: "shield", label: "Щитоносец" },
  { id: "polearm", label: "Древковое" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [skin, setSkin] = useState(SKINS[1].id);
  const [username, setUsername] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    localStorage.setItem("mos.skin", skin);
    localStorage.setItem("mos.gender", gender);
    localStorage.setItem("mos.username", username.trim());
    markProfileCreated();
    router.push("/profile");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
      <h1 className="font-display text-3xl text-mos-amber">Выбор персонажа</h1>
      <p className="mt-2 text-mos-muted">Обязательный шаг после регистрации. Временно — образы в духе OnlyGames / starter avatars школы.</p>
      <div className="mt-6 flex gap-2">
        {(["MALE", "FEMALE"] as const).map((g) => (
          <button key={g} type="button" onClick={() => setGender(g)} className={`mos-btn ${gender === g ? "" : "border-mos-line text-mos-text"}`}>
            {g === "MALE" ? "Мужской" : "Женский"}
          </button>
        ))}
      </div>
      <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
        {SKINS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSkin(s.id)}
            className={`min-w-[120px] border p-4 ${skin === s.id ? "border-mos-amber text-mos-amber" : "border-mos-line text-mos-muted"}`}
          >
            <div className="mb-3 grid h-28 place-items-center bg-mos-stone font-display text-2xl">{s.label[0]}</div>
            {s.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block text-xs uppercase tracking-widest text-mos-muted">
          Имя персонажа
          <input className="mt-1 w-full border border-mos-line bg-mos-stone px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <button type="submit" className="mos-btn">
          Создать профиль
        </button>
      </form>
    </main>
  );
}
