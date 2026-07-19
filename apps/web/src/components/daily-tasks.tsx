import ProfileMiniCard from "@/components/profile-mini-card";
import Progress from "@/components/ui/progress";
import type { GenderId } from "@/lib/avatars";
import type { OgCharacterId } from "@/lib/characters";
import type { Quest } from "@/lib/content";
import { questIconUrl } from "@/lib/content-icons";
import { cn } from "@/lib/utils";

type DailyTasksProps = {
  userLevel: number;
  currentXp: number;
  xpToNext: number;
  tasks: Quest[];
  selectedSkinId?: OgCharacterId;
  gender?: GenderId;
  avatarUrl?: string;
  fallbackLetter?: string;
  className?: string;
};

export default function DailyTasks({
  userLevel,
  currentXp,
  xpToNext,
  tasks,
  selectedSkinId,
  gender,
  avatarUrl,
  fallbackLetter,
  className,
}: DailyTasksProps) {
  return (
    <div
      className={cn(
        "bg-witcher-panel flex w-[200px] flex-col gap-3 rounded-2xl p-3 md:w-[300px] md:gap-4 md:rounded-[32px] md:p-6",
        className,
      )}
    >
      <ProfileMiniCard
        userLevel={userLevel}
        currentXp={currentXp}
        xpToNext={xpToNext}
        selectedSkinId={selectedSkinId}
        gender={gender}
        avatarUrl={avatarUrl}
        fallbackLetter={fallbackLetter}
      />

      <div className="flex w-full flex-col gap-2">
        <h3 className="font-display text-[10px] font-medium leading-4 text-mos-text md:text-[15px] md:leading-6">
          Задания
        </h3>

        <div className="flex w-full flex-col gap-1.5 md:gap-4">
          {tasks.map((task) => (
            <TaskRow key={task.key} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Quest }) {
  const target = 1;
  const current = 0;

  return (
    <div className="flex w-full flex-col gap-1 transition-opacity duration-200 hover:opacity-80">
      <div className="flex w-full items-start justify-between gap-2 text-[8px] leading-3 md:text-xs md:leading-4">
        <div className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- content icons from public/CDN */}
          <img
            src={questIconUrl(task.key, task.icon)}
            alt=""
            className="h-6 w-6 shrink-0 rounded-full bg-mos-stone object-cover md:h-8 md:w-8"
            loading="lazy"
            decoding="async"
            aria-hidden
          />
          <p className="truncate font-normal text-mos-text">{task.title}</p>
        </div>
        <p className="whitespace-nowrap font-medium text-mos-amber">+{task.xp} XP</p>
      </div>
      <div className="flex w-full items-center justify-between">
        <Progress value={current} max={target} size="md" className="max-w-[85%]" />
        <div className="ml-2 flex items-center gap-1 text-[8px] font-medium leading-3 text-mos-text md:text-xs md:leading-4">
          <span>{current}</span>
          <span>/</span>
          <span>{target}</span>
        </div>
      </div>
    </div>
  );
}
