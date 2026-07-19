export default function SkillPoints({ skillPoints }: { skillPoints: number }) {
  return (
    <div className="bg-gradient-light-profile inline-flex w-fit items-center justify-end gap-2 rounded-2xl px-3 py-1.5 backdrop-blur-md md:gap-3 md:rounded-[32px] md:px-7 md:py-7">
      <p className="font-display text-[8px] font-medium leading-2.5 text-mos-text md:text-[15px] md:leading-6">
        Доступно умений
      </p>
      <div className="flex min-w-[32px] items-center justify-center rounded-lg bg-white/10 px-1 py-0.5 md:min-w-[42px] md:rounded-xl md:px-2">
        <p className="font-display text-[8px] font-medium text-mos-text md:text-[15px] md:leading-6">
          {skillPoints}
        </p>
      </div>
    </div>
  );
}
