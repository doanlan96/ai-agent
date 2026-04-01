"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui";
import { Send, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isProcessing?: boolean;
  isDocumentMode?: boolean;
  onToggleDocumentMode?: (enabled: boolean) => void;
}

export function ChatInput({
  onSend,
  disabled,
  isProcessing,
  isDocumentMode = false,
  onToggleDocumentMode,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isProcessing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isProcessing]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div
        className={cn(
          "bg-background/80 border-border/50 focus-within:ring-primary/20 focus-within:border-primary/30 relative flex items-end gap-2 rounded-[28px] border p-2 pl-4 shadow-2xl backdrop-blur-md transition-all duration-200 focus-within:ring-1",
          disabled && "opacity-60 grayscale-[0.5]",
          isDocumentMode && "border-primary/40 bg-primary/5"
        )}
      >
        <div className="flex items-center self-center pb-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleDocumentMode?.(!isDocumentMode)}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 transition-all",
              isDocumentMode
                ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 shadow-sm"
                : "text-muted-foreground hover:bg-secondary border-transparent"
            )}
            title={isDocumentMode ? "Document Mode Enabled" : "Enable Document Mode"}
          >
            <FileText className={cn("h-3.5 w-3.5", isDocumentMode && "fill-current")} />
            <span className="text-[11px] font-medium whitespace-nowrap">Document Mode</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 items-end">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isDocumentMode ? "Ask about your documents..." : "Reply to AI Assistant..."
            }
            disabled={disabled}
            rows={1}
            className="scrollbar-thin max-h-[200px] w-full resize-none bg-transparent px-1 py-2 text-sm focus:outline-none disabled:cursor-not-allowed sm:text-base"
          />
        </form>

        <div className="flex items-center gap-1.5 pr-1">
          <Button
            onClick={() => handleSubmit()}
            size="icon"
            disabled={disabled || !message.trim()}
            className={cn(
              "h-9 w-9 rounded-full transition-transform active:scale-95",
              message.trim()
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary bg-transparent"
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground/60 mt-2 w-full px-2 text-center text-[10px]">
        {isDocumentMode
          ? "Document Mode is active. Responses will be grounded in your documents."
          : "AI Assistant can make mistakes. Please check important legal information."}
      </p>
    </div>
  );
}
