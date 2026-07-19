"use client";

import TalentCard from "@/components/talents/talent-card";
import {
  TREE_LINE_CLASS,
  type MosTalent,
  type MosTalentTree,
  type TalentTreeType,
} from "@/lib/talents-catalog";
import { canLearnTalent } from "@/lib/talents-state";
import { cn } from "@/lib/utils";

function whereIsLine(
  indexMatrix: number,
  indexChild: number,
  matrix: string[][],
  ignore: "above" | "above-left" | "above-right" | "horizontal",
) {
  if (ignore !== "above" && indexMatrix > 0 && matrix[indexMatrix - 1][indexChild] === "1") return "above";
  if (
    ignore !== "above-left" &&
    indexMatrix > 0 &&
    indexChild > 0 &&
    matrix[indexMatrix - 1][indexChild - 1] === "1"
  ) {
    return "above-left";
  }
  if (
    ignore !== "above-right" &&
    indexMatrix > 0 &&
    indexChild < matrix[indexMatrix].length - 1 &&
    matrix[indexMatrix - 1][indexChild + 1] === "1"
  ) {
    return "above-right";
  }
  if (
    ignore !== "horizontal" &&
    indexChild < matrix[indexMatrix].length - 2 &&
    matrix[indexMatrix][indexChild + 2] === "1" &&
    matrix[indexMatrix + 1]?.[indexChild + 1] !== "1"
  ) {
    return "horizontal";
  }
  return undefined;
}

function Line({ className, type }: { className?: string; type: TalentTreeType }) {
  return (
    <div
      className={cn(
        "h-10 w-2 rounded-[10px] opacity-40 md:h-28 md:w-3",
        TREE_LINE_CLASS[type],
        className,
      )}
    />
  );
}

function renderTalentLines(
  lineFirst: string | undefined,
  lineSecond: string | undefined,
  type: TalentTreeType,
) {
  return (
    <>
      {lineFirst === "above" ? (
        <Line type={type} className="absolute bottom-1/2 left-1/2 origin-bottom -translate-x-1/2" />
      ) : null}
      {lineFirst === "above-right" || lineSecond === "above-right" ? (
        <Line
          type={type}
          className="absolute bottom-1/2 left-1/2 origin-bottom -translate-x-1/2 rotate-[25deg] max-md:rotate-[32deg]"
        />
      ) : null}
      {lineFirst === "above-left" || lineSecond === "above-left" ? (
        <Line
          type={type}
          className="absolute bottom-1/2 left-1/2 origin-bottom -translate-x-1/2 -rotate-[25deg] max-md:-rotate-[32deg]"
        />
      ) : null}
      {lineFirst !== "horizontal" && lineSecond === "horizontal" ? (
        <Line
          type={type}
          className="absolute bottom-1/2 left-1/2 h-16 origin-bottom -translate-x-1/2 rotate-90"
        />
      ) : null}
      {lineFirst === "horizontal" && lineSecond === "horizontal" ? (
        <Line
          type={type}
          className="absolute bottom-1/2 left-1/2 h-16 origin-bottom -translate-x-1/2 rotate-90"
        />
      ) : null}
    </>
  );
}

type SkillThreeProps = MosTalentTree & {
  availablePoints: number;
  onActivate: (talent: MosTalent) => Promise<void>;
  onLearn: (talent: MosTalent) => Promise<void>;
  onFavourite: (talent: MosTalent) => Promise<void>;
  loading: { favorite: boolean; activate: boolean; learn: boolean };
  className?: string;
};

export default function SkillThree({
  type,
  matrix,
  skills,
  availablePoints,
  onActivate,
  onLearn,
  onFavourite,
  loading,
  className,
}: SkillThreeProps) {
  return (
    <div
      className={cn(
        // OG skill-three contract: fixed 6×7 board, items-end, grid-cols-7
        "relative -ml-3 grid h-full max-h-[250px] w-full max-w-[350px] grid-cols-7 items-end justify-center gap-x-[18px] gap-y-0 max-xl:max-w-[200px] max-xl:gap-x-2 max-xl:gap-y-0 md:-ml-8 md:max-h-[650px]",
        className,
      )}
    >
      {matrix.map((row, indexMatrix) =>
        row.map((node, indexChild) => {
          const talent = skills.find(
            (skill) => skill.position[0] === indexMatrix && skill.position[1] === indexChild,
          );
          if (node !== "1" || !talent) {
            return <div key={`${indexMatrix}-${indexChild}`} />;
          }

          const lineFirst = whereIsLine(indexMatrix, indexChild, matrix, "above-right");
          const lineSecond = whereIsLine(indexMatrix, indexChild, matrix, "above-left");
          const canBeLearned =
            canLearnTalent(talent, skills, availablePoints) &&
            !loading.favorite &&
            !loading.activate &&
            !loading.learn;

          return (
            <div key={`${indexMatrix}-${indexChild}`} className="relative">
              <TalentCard
                talent={talent}
                variant="secondary"
                treeType={type}
                canBeLearned={canBeLearned}
                onActivate={() => void onActivate(talent)}
                onLearn={() => void onLearn(talent)}
                onFavourite={() => void onFavourite(talent)}
                loading={loading}
                line={renderTalentLines(lineFirst, lineSecond, type)}
              />
            </div>
          );
        }),
      )}
    </div>
  );
}
