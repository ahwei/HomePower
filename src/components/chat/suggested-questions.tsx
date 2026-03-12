"use client";

import { Lightbulb } from "lucide-react";

const SUGGESTIONS = [
  "我有幾台設備？每月總共用多少電？",
  "哪台設備最耗電？有什麼節電建議？",
  "幫我算上個月的電費",
  "比較夏天和冬天的用電差異",
  "用時間電價方案會比較省嗎？",
  "這個月的每日用電趨勢如何？",
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        <span>試試以下問題</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSelect(q)}
            className="rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
