import Progress from "@/components/ui/progress";

type StatCategory = {
  id: string;
  name: string;
  completed: number;
  total: number;
};

type AchievementStatisticsProps = {
  overall: { completed: number; total: number };
  categories: StatCategory[];
};

export default function AchievementStatistics({
  overall,
  categories,
}: AchievementStatisticsProps) {
  return (
    <div className="og-panel hidden flex-col gap-6 px-6 py-5 md:flex">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-display text-mos-text">Всего</span>
          <span className="text-mos-muted">
            {overall.completed}/{overall.total}
          </span>
        </div>
        <Progress value={overall.completed} max={overall.total || 1} size="achievement" showText />
      </div>
      {categories.map((cat) => (
        <div key={cat.id} className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-mos-text">{cat.name}</span>
            <span className="text-mos-muted">
              {cat.completed}/{cat.total}
            </span>
          </div>
          <Progress value={cat.completed} max={cat.total || 1} size="achievement" />
        </div>
      ))}
    </div>
  );
}
