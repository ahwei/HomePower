"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="詢問用電相關問題..."
        className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        disabled={isLoading}
      />
      <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
