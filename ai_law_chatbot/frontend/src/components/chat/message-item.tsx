"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { ToolCallCard } from "./tool-call-card";
import { MarkdownContent } from "./markdown-content";
import { CopyButton } from "./copy-button";
import { User } from "lucide-react";

interface MessageItemProps {
  message: ChatMessage;
  groupPosition?: "first" | "middle" | "last" | "single";
}

export function MessageItem({ message, groupPosition }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "group relative flex w-full flex-col gap-2 py-4 sm:py-6",
        isUser ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "relative flex max-w-[90%] flex-col gap-2 sm:max-w-[85%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {isUser ? (
          <div className="flex gap-3 items-end">
            <div className="bg-secondary/80 text-secondary-foreground rounded-2xl px-4 py-2.5 text-sm shadow-sm ring-1 ring-border/50">
              <p className="break-words whitespace-pre-wrap">{message.content}</p>
            </div>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mb-1">
              <User className="h-4 w-4" />
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* AI Message Content - No Bubble, Premium Typography */}
            <div className="prose-sm sm:prose-base max-w-none text-foreground/90 leading-relaxed">
              <MarkdownContent content={message.content} />
              {message.isStreaming && (
                <span className="ml-1 inline-block h-4 w-1 animate-pulse rounded-full bg-primary/40" />
              )}
            </div>

            {/* Action Bar (Copy, etc.) - Visible on Hover */}
            {!message.isStreaming && message.content && (
              <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <CopyButton
                  text={message.content}
                  className="h-8 w-8 bg-background/50 hover:bg-background border shadow-sm"
                />
              </div>
            )}

            {/* Tool Calls */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="w-full space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <span className="h-px flex-1 bg-border/50" />
                  <span>Processing Information</span>
                  <span className="h-px flex-1 bg-border/50" />
                </div>
                {message.toolCalls.map((toolCall) => (
                  <ToolCallCard key={toolCall.id} toolCall={toolCall} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
