"use client";

import TalentCard from "@/components/talents/talent-card";
import {
  TREE_BORDER_COLOR,
  type MosTalent,
  type MosTalentTree,
  type TalentTreeType,
} from "@/lib/talents-catalog";
import { canLearnTalent } from "@/lib/talents-state";
import { cn } from "@/lib/utils";

const COLS = 7;
const ROWS = 6;

type LineKind = "above" | "above-left" | "above-right" | "horizontal";

type TreeLine = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function cellCenter(col: number, row: number) {
  return { x: col + 0.5, y: row + 0.5 };
}

function collectTreeLines(matrix: string[][]): TreeLine[] {
  const lines: TreeLine[] = [];

  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (matrix[row][col] !== "1") continue;

      const from = cellCenter(col, row);
      const kinds: LineKind[] = [];

      if (row > 0 && matrix[row - 1][col] === "1") kinds.push("above");
      if (row > 0 && col > 0 && matrix[row - 1][col - 1] === "1") kinds.push("above-left");
      if (row > 0 && col < matrix[row].length - 1 && matrix[row - 1][col + 1] === "1") {
        kinds.push("above-right");
      }
      if (
        col < matrix[row].length - 2 &&
        matrix[row][col + 2] === "1" &&
        matrix[row + 1]?.[col + 1] !== "1"
      ) {
        kinds.push("horizontal");
      }

      for (const kind of kinds) {
        let to = from;
        if (kind === "above") to = cellCenter(col, row - 1);
        if (kind === "above-left") to = cellCenter(col - 1, row - 1);
        if (kind === "above-right") to = cellCenter(col + 1, row - 1);
        if (kind === "horizontal") to = cellCenter(col + 2, row);

        lines.push({
          key: `${row}-${col}-${kind}`,
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
        });
      }
    }
  }

  return lines;
}

function TreeConnectors({ matrix, type }: { matrix: string[][]; type: TalentTreeType }) {
  const lines = collectTreeLines(matrix);
  const stroke = TREE_BORDER_COLOR[type];

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${COLS} ${ROWS}`}
      preserveAspectRatio="none"
    >
      {lines.map((line) => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={stroke}
          strokeLinecap="round"
          opacity={0.4}
          vectorEffect="non-scaling-stroke"
          className="[stroke-width:6px] md:[stroke-width:10px] min-[2400px]:[stroke-width:14px]"
        />
      ))}
    </svg>
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
        "relative h-[250px] w-full max-w-[350px] max-xl:max-w-[200px] md:h-[650px] min-[2400px]:h-[975px] min-[2400px]:max-w-[560px]",
        className,
      )}
    >
      <TreeConnectors matrix={matrix} type={type} />
      <div className="relative z-10 grid h-full w-full grid-cols-7 grid-rows-6 items-center justify-items-center gap-0">
        {matrix.map((row, indexMatrix) =>
          row.map((node, indexChild) => {
            const talent = skills.find(
              (skill) => skill.position[0] === indexMatrix && skill.position[1] === indexChild,
            );
            if (node !== "1" || !talent) {
              return <div key={`${indexMatrix}-${indexChild}`} />;
            }

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
                />
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
