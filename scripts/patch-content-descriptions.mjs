/**
 * Adds Russian description fields to quests/achievements from 104-content-pack.md conditions.
 * Updates apps/web/public/content/starter.json and schemas/content/school.fencing.starter.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const questDescriptions = {
  "path.profile": "Привяжите персонажа и заполните безопасный профиль ученика.",
  "path.safety": "Пройдите инструктаж по безопасности и получите подтверждение тренера.",
  "path.first_trial": "Посетите пробное занятие и получите подтверждение посещаемости.",
  "path.first_training": "Посетите первое регулярное занятие в зале.",
  "path.first_record": "Получите первую подтверждённую запись тренировки.",
  "path.choose_weapon": "Получите первое положительное начисление мастерства по любому оружию.",
  "path.monthly_roll": "Совершите первый действительный месячный бросок d8.",
  "path.open_inventory": "Откройте инвентарь и осмотрите полученный предмет.",
  "path.choose_cosmetic": "Активируйте один доступный косметический элемент профиля.",
  "path.complete": "Завершите все предыдущие задания пути ученика.",
  "training.ready": "Отметьте одно зачтённое посещение занятия.",
  "training.focus": "Получите подтверждение тренера по одной учебной цели занятия.",
  "training.balance": "Выполните упражнение с обеими сторонами, если этого требует программа.",
  "training.partner": "Получите подтверждение тренера по парному упражнению.",
  "training.reflection": "Заполните короткую рефлексию после занятия.",
  "weekly.rhythm.2": "Посетите два занятия за одну учебную неделю школы.",
  "weekly.rhythm.3": "Посетите три занятия за одну учебную неделю школы.",
  "weekly.two_paths": "Получите положительное начисление мастерства по двум путям оружия.",
  "weekly.curriculum": "Выполните три разные подтверждённые учебные цели.",
  "weekly.history": "Пройдите одну образовательную карточку или глоссарийное задание.",
  "weekly.community": "Выполните безопасное парное или приветственное задание от тренера.",
  "weekly.event_prep": "Пройдите чеклист подготовки к событию школы.",
  "monthly.roll": "Совершите действительный месячный бросок d8.",
  "monthly.sessions.8": "Посетите восемь зачтённых занятий за месяц.",
  "monthly.new_path": "Впервые получите зачёт по ранее неоткрытому пути оружия.",
  "monthly.consistency": "Имейте зачтённые посещения в трёх разных неделях месяца.",
  "monthly.event": "Примите участие в одном зарегистрированном событии школы.",
  "season.eight_paths":
    "Пройдите все восемь глав сезонной кампании: история, безопасность, учебная цель, мастерство оружия и опциональное сообщество.",
};

const achievementDescriptions = {
  "start.first_salute": "Посетите первое регулярное занятие.",
  "start.safety": "Пройдите подтверждённый инструктаж по безопасности.",
  "start.character": "Активируйте привязку персонажа к профилю.",
  "start.inventory": "Получите первый предмет в инвентарь.",
  "start.quest": "Завершите первое задание.",
  "start.event": "Примите участие в первом зарегистрированном событии школы.",
  "practice.sessions": "Наберите зачтённые посещения занятий: 1, 10, 25, 50, 100, 250, 500.",
  "practice.weeks": "Недели с минимум двумя зачтёнными посещениями: 4, 12, 26, 52.",
  "practice.years": "Годовщины активного участия в школе: 1, 3, 5, 10 лет.",
  "practice.return": "Вернитесь на первое зачтённое занятие после добровольного перерыва.",
  "mastery.first_rank": "Достигните ранга 1 по любому пути оружия.",
  "mastery.four_paths": "Достигните ранга 1 по четырём разным путям оружия.",
  "mastery.eight_paths": "Достигните ранга 1 по всем восьми путям оружия.",
  "mastery.two_rank_five": "Достигните ранга 5 по двум путям оружия.",
  "mastery.one_rank_ten": "Достигните ранга 10 по одному пути оружия.",
  "mastery.all_rank_ten": "Достигните ранга 10 по всем восьми путям оружия.",
  "mastery.spada_a_una_mano.rank": "Повышайте ранг мастерства по пути «одноручный меч» (1–10).",
  "mastery.due_spade.rank": "Повышайте ранг мастерства по пути «два меча» (1–10).",
  "mastery.spada_e_scudo.rank": "Повышайте ранг мастерства по пути «меч и щит» (1–10).",
  "mastery.spada_a_due_mani.rank": "Повышайте ранг мастерства по пути «двуручный меч» (1–10).",
  "mastery.spadone.rank": "Повышайте ранг мастерства по пути «спадоне» (1–10).",
  "mastery.ascia_e_alabarda.rank": "Повышайте ранг мастерства по пути «топор и алебарда» (1–10).",
  "mastery.spiedo_e_partesana.rank": "Повышайте ранг мастерства по пути «копьё и протазан» (1–10).",
  "mastery.spiedo_e_scudo.rank": "Повышайте ранг мастерства по пути «копьё и щит» (1–10).",
  "curriculum.objectives": "Выполните подтверждённые учебные цели: 10, 25, 50, 100.",
  "curriculum.marozzo": "Завершите образовательную коллекцию Мароццо.",
  "community.events": "Участвуйте в событиях школы: 1, 5, 10, 25.",
  "community.mentor": "Выполните 5 подтверждённых заданий поддержки новичков.",
  "community.tournament": "Примите участие в первом зарегистрированном турнире школы.",
  "community.masterclass": "Посетите первый мастер-класс.",
};

const paths = [
  resolve("apps/web/public/content/starter.json"),
  resolve("schemas/content/school.fencing.starter.json"),
];

for (const path of paths) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  let missingQuests = [];
  let missingAchievements = [];

  data.quests = data.quests.map((q) => {
    const description = questDescriptions[q.key];
    if (!description) missingQuests.push(q.key);
    return description ? { ...q, description } : q;
  });
  data.achievements = data.achievements.map((a) => {
    const description = achievementDescriptions[a.key];
    if (!description) missingAchievements.push(a.key);
    return description ? { ...a, description } : a;
  });

  if (missingQuests.length || missingAchievements.length) {
    console.error("Missing descriptions:", { missingQuests, missingAchievements });
    process.exit(1);
  }

  data.bundleVersion = Math.max(Number(data.bundleVersion) || 0, 2) + 1;
  data.source = "Master of the Sword module/fencing-school/104-content-pack.md";
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(
    `Updated ${path}: ${data.quests.length} quests, ${data.achievements.length} achievements, bundleVersion=${data.bundleVersion}`,
  );
}
