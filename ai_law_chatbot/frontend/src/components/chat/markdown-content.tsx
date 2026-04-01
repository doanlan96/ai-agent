"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      className="max-w-none"
      components={{
        pre({ children, ...props }) {
          const codeElement = children as React.ReactElement<{
            children?: string;
          }>;
          const codeContent =
            typeof codeElement?.props?.children === "string" ? codeElement.props.children : "";

          return (
            <div className="group relative my-4">
              <pre className="bg-secondary/40 overflow-x-auto rounded-xl p-4 text-xs border border-border/40 shadow-sm" {...props}>
                {children}
              </pre>
              {codeContent && (
                <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <CopyButton text={codeContent} className="h-8 w-8 bg-background/80" />
                </div>
              )}
            </div>
          );
        },
        code({ className, children, ...props }) {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-secondary/60 rounded-md px-1.5 py-0.5 font-mono text-[0.85em] text-primary" {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className={cn("font-mono", className)} {...props}>
              {children}
            </code>
          );
        },
        a({ href, children, ...props }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline decoration-primary/30 underline-offset-4"
              {...props}
            >
              {children}
            </a>
          );
        },
        p({ children, ...props }) {
          return (
            <p className="mb-4 last:mb-0 leading-relaxed text-foreground/90" {...props}>
              {children}
            </p>
          );
        },
        ul({ children, ...props }) {
          return (
            <ul className="mb-4 ml-6 list-disc space-y-2 last:mb-0" {...props}>
              {children}
            </ul>
          );
        },
        ol({ children, ...props }) {
          return (
            <ol className="mb-4 ml-6 list-decimal space-y-2 last:mb-0" {...props}>
              {children}
            </ol>
          );
        },
        li({ children, ...props }) {
          return (
            <li className="pl-1" {...props}>
              {children}
            </li>
          );
        },
        h1({ children, ...props }) {
          return (
            <h1 className="mb-4 mt-6 text-2xl font-bold tracking-tight text-foreground" {...props}>
              {children}
            </h1>
          );
        },
        h2({ children, ...props }) {
          return (
            <h2 className="mb-3 mt-5 text-xl font-semibold tracking-tight text-foreground" {...props}>
              {children}
            </h2>
          );
        },
        h3({ children, ...props }) {
          return (
            <h3 className="mb-2 mt-4 text-lg font-semibold text-foreground" {...props}>
              {children}
            </h3>
          );
        },
        blockquote({ children, ...props }) {
          return (
            <blockquote
              className="border-primary/20 mb-4 border-l-3 pl-4 italic text-muted-foreground bg-secondary/20 py-1 rounded-r-lg"
              {...props}
            >
              {children}
            </blockquote>
          );
        },
        table({ children, ...props }) {
          return (
            <div className="my-6 overflow-x-auto rounded-xl border border-border/50 shadow-sm">
              <table className="min-w-full text-sm divide-y divide-border/50" {...props}>
                {children}
              </table>
            </div>
          );
        },
        thead({ children, ...props }) {
          return <thead className="bg-secondary/30" {...props}>{children}</thead>;
        },
        th({ children, ...props }) {
          return (
            <th className="px-4 py-3 text-left font-semibold text-foreground/80" {...props}>
              {children}
            </th>
          );
        },
        td({ children, ...props }) {
          return (
            <td className="px-4 py-3 border-t border-border/30 text-foreground/70" {...props}>
              {children}
            </td>
          );
        },
        hr({ ...props }) {
          return <hr className="border-border/50 my-8" {...props} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
