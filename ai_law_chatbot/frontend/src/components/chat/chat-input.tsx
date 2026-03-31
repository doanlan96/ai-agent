"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui";
import { Send, Loader2, Plus, Mic, Sparkles } from "lucide-react";
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
  onToggleDocumentMode 
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
    <div className="relative w-full max-w-3xl mx-auto">
      <div 
        className={cn(
          "relative flex items-end gap-2 bg-background/80 backdrop-blur-md rounded-[28px] border border-border/50 p-2 pl-4 shadow-2xl transition-all duration-200 focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/30",
          disabled && "opacity-60 grayscale-[0.5]",
          isDocumentMode && "border-primary/40 bg-primary/5"
        )}
      >
        <div className="flex items-center self-center pb-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onToggleDocumentMode?.(!isDocumentMode)}
            className={cn(
              "h-8 w-8 rounded-full transition-all",
              isDocumentMode 
                ? "bg-primary/20 text-primary hover:bg-primary/30" 
                : "text-muted-foreground hover:bg-secondary"
            )}
            title={isDocumentMode ? "Document Mode Enabled" : "Enable Document Mode"}
          >
            <Sparkles className={cn("h-4 w-4", isDocumentMode && "fill-current")} />
            <span className="sr-only">Toggle Document Mode</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex items-end">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDocumentMode ? "Ask about your documents..." : "Reply to AI Assistant..."}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent py-2 px-1 text-sm sm:text-base focus:outline-none disabled:cursor-not-allowed max-h-[200px] scrollbar-thin"
          />
        </form>

        <div className="flex items-center gap-1.5 pr-1">
          <Button
            onClick={() => handleSubmit()}
            size="icon"
            disabled={disabled || !message.trim()}
            className={cn(
              "h-9 w-9 rounded-full transition-transform active:scale-95",
              message.trim() ? "bg-primary text-primary-foreground shadow-sm" : "bg-transparent text-muted-foreground hover:bg-secondary"
            )}
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground/60 w-full px-2">
        {isDocumentMode 
          ? "Document Mode is active. Responses will be grounded in your documents."
          : "AI Assistant can make mistakes. Please check important legal information."
        }
      </p>
    </div>
  );
}
