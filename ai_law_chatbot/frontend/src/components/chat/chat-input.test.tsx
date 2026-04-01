import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatInput } from "./chat-input";

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Send: () => <div data-testid="send-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Mic: () => <div data-testid="mic-icon" />,
  Sparkles: ({ className }: { className?: string }) => (
    <div data-testid="sparkles-icon" className={className} />
  ),
}));

describe("ChatInput component", () => {
  it("should render correctly", () => {
    render(<ChatInput onSend={() => {}} />);
    expect(screen.getByPlaceholderText(/reply to ai assistant/i)).toBeInTheDocument();
    expect(screen.getByTestId("sparkles-icon")).toBeInTheDocument();
  });

  it("should toggle document mode when requested", () => {
    const onToggle = vi.fn();
    render(<ChatInput onSend={() => {}} isDocumentMode={false} onToggleDocumentMode={onToggle} />);
    
    const toggleButton = screen.getByTitle(/enable document mode/i);
    fireEvent.click(toggleButton);
    
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("should show document mode placeholder when enabled", () => {
    render(<ChatInput onSend={() => {}} isDocumentMode={true} />);
    expect(screen.getByPlaceholderText(/ask about your documents/i)).toBeInTheDocument();
  });

  it("should call onSend with message content", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    
    const textarea = screen.getByPlaceholderText(/reply to ai assistant/i);
    fireEvent.change(textarea, { target: { value: "Hello AI" } });
    
    const sendButton = screen.getByRole("button", { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(onSend).toHaveBeenCalledWith("Hello AI");
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("should not call onSend if message is empty", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    
    const sendButton = screen.getByRole("button", { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(onSend).not.toHaveBeenCalled();
  });

  it("should call onSend on Enter key press", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    
    const textarea = screen.getByPlaceholderText(/reply to ai assistant/i);
    fireEvent.change(textarea, { target: { value: "Hello AI" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });
    
    expect(onSend).toHaveBeenCalledWith("Hello AI");
  });

  it("should not call onSend on Shift+Enter key press", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    
    const textarea = screen.getByPlaceholderText(/reply to ai assistant/i);
    fireEvent.change(textarea, { target: { value: "Hello AI" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: true });
    
    expect(onSend).not.toHaveBeenCalled();
  });
});
