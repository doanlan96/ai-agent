"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useChat, useLocalChat } from "@/hooks";
import { cn } from "@/lib/utils";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { ToolApprovalDialog } from "./tool-approval-dialog";
import { Button } from "@/components/ui";
import { Wifi, WifiOff, RotateCcw, Bot } from "lucide-react";
import type { PendingApproval, Decision } from "@/types";
import { useConversationStore, useChatStore, useAuthStore } from "@/stores";
import { useConversations } from "@/hooks";
interface ChatContainerProps {
  useLocalStorage?: boolean;
}

export function ChatContainer({ useLocalStorage = false }: ChatContainerProps) {
  const { isAuthenticated } = useAuthStore();

  const shouldUseLocal = useLocalStorage || !isAuthenticated;

  if (shouldUseLocal) {
    return <LocalChatContainer />;
  }

  return <AuthenticatedChatContainer />;
}

function AuthenticatedChatContainer() {
  const { currentConversationId, currentMessages } = useConversationStore();
  const { addMessage: addChatMessage } = useChatStore();
  const { fetchConversations } = useConversations();
  const prevConversationIdRef = useRef<string | null | undefined>(undefined);

  const handleConversationCreated = useCallback(
    (conversationId: string) => {
      fetchConversations();
    },
    [fetchConversations]
  );

  const {
    messages,
    isConnected,
    isProcessing,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    pendingApproval,
    sendResumeDecisions,
  } = useChat({
    conversationId: currentConversationId,
    onConversationCreated: handleConversationCreated,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear messages when conversation changes, but NOT when going from null to a new ID
  // (that happens when a new chat is saved - we want to keep the messages)
  useEffect(() => {
    const prevId = prevConversationIdRef.current;
    const currId = currentConversationId;

    // Skip initial mount
    if (prevId === undefined) {
      prevConversationIdRef.current = currId;
      return;
    }

    // Clear messages when:
    // 1. Going from a conversation to null (new chat)
    // 2. Switching between two different conversations
    // Do NOT clear when going from null to a conversation (new chat being saved)
    const shouldClear =
      currId === null || // Going to new chat
      (prevId !== null && prevId !== currId); // Switching between conversations

    if (shouldClear) {
      clearMessages();
    }

    prevConversationIdRef.current = currId;
  }, [currentConversationId, clearMessages]);

  // Load messages from conversation store when switching to a saved conversation
  useEffect(() => {
    if (currentMessages.length > 0) {
      currentMessages.forEach((msg) => {
        addChatMessage({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          toolCalls: msg.tool_calls?.map((tc) => ({
            id: tc.tool_call_id,
            name: tc.tool_name,
            args: tc.args,
            result: tc.result,
            status: tc.status === "failed" ? "error" : tc.status,
          })),
        });
      });
    }
  }, [currentMessages, addChatMessage]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ChatUI
      messages={messages}
      isConnected={isConnected}
      isProcessing={isProcessing}
      sendMessage={sendMessage}
      clearMessages={clearMessages}
      messagesEndRef={messagesEndRef}
      pendingApproval={pendingApproval}
      onResumeDecisions={sendResumeDecisions}
    />
  );
}

function LocalChatContainer() {
  const {
    messages,
    isConnected,
    isProcessing,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    pendingApproval,
    sendResumeDecisions,
  } = useLocalChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ChatUI
      messages={messages}
      isConnected={isConnected}
      isProcessing={isProcessing}
      sendMessage={sendMessage}
      clearMessages={clearMessages}
      messagesEndRef={messagesEndRef}
      pendingApproval={pendingApproval}
      onResumeDecisions={sendResumeDecisions}
    />
  );
}

interface ChatUIProps {
  messages: import("@/types").ChatMessage[];
  isConnected: boolean;
  isProcessing: boolean;
  sendMessage: (content: string, options?: { botTypes?: string }) => void;
  clearMessages: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  // Human-in-the-Loop support
  pendingApproval?: PendingApproval | null;
  onResumeDecisions?: (decisions: Decision[]) => void;
}

function ChatUI({
  messages,
  isConnected,
  isProcessing,
  sendMessage,
  clearMessages,
  messagesEndRef,
  pendingApproval,
  onResumeDecisions,
}: ChatUIProps) {
  const [isDocumentMode, setIsDocumentMode] = useState(false);

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Messages Area */}
      <div className="scrollbar-thin flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
          {messages.length === 0 ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-primary/5 blur-2xl animate-pulse" />
                <div className="bg-secondary/50 flex h-20 w-20 items-center justify-center rounded-3xl border border-border/50 shadow-sm backdrop-blur-sm sm:h-24 sm:w-24">
                  <Bot className="h-10 w-10 text-primary sm:h-12 sm:w-12" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Legal AI Assistant
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base max-w-[280px] sm:max-w-md mx-auto leading-relaxed">
                  How can I help you with bank regulations or legal documents today?
                </p>
              </div>
            </div>
          ) : (
            <MessageList messages={messages} />
          )}
          <div ref={messagesEndRef} className="h-32" /> {/* Extra space for floating input */}
        </div>
      </div>

      {/* Human-in-the-Loop: Tool Approval Dialog */}
      {pendingApproval && onResumeDecisions && (
        <div className="absolute bottom-32 left-1/2 w-full max-w-2xl -translate-x-1/2 px-4 z-40">
          <ToolApprovalDialog
            actionRequests={pendingApproval.actionRequests}
            reviewConfigs={pendingApproval.reviewConfigs}
            onDecisions={onResumeDecisions}
            disabled={!isConnected}
          />
        </div>
      )}

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 z-30 pointer-events-none">
        <div className="pointer-events-auto bg-gradient-to-t from-background via-background/80 to-transparent pb-2 sm:pb-4 pt-8">
          <ChatInput
            onSend={(content) => sendMessage(content, { botTypes: isDocumentMode ? "document" : undefined })}
            disabled={!isConnected || isProcessing || !!pendingApproval}
            isProcessing={isProcessing}
            isDocumentMode={isDocumentMode}
            onToggleDocumentMode={setIsDocumentMode}
          />
          
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 opacity-60">
              <div className={cn(
                "h-1.5 w-1.5 rounded-full animate-pulse",
                isConnected ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {isConnected ? "System Ready" : "Offline"}
              </span>
            </div>
            
            <button 
              onClick={clearMessages}
              className="group flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3 w-3 group-hover:rotate-[-45deg] transition-transform" />
              Reset Thread
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
