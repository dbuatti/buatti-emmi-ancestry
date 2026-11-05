import { Fragment } from 'react';

/**
 * Matches absolute http(s) URLs inside free text. Trailing punctuation is excluded so a
 * URL at the end of a sentence — ".../LeG9zQR (page 23)." — doesn't swallow the bracket
 * or the full stop.
 */
const URL_SPLIT = /(https?:\/\/[^\s<>"'`]+[^\s<>"'`.,;:!?)\]])/g;
const IS_URL = /^https?:\/\//;

interface LinkifiedTextProps {
  text: string;
  className?: string;
  /** Use for text that sits inside a clickable parent (cards, rows) — stops the click bubbling. */
  stopPropagation?: boolean;
  linkClassName?: string;
}

/**
 * Renders free text with any embedded URL turned into a real, clickable link.
 * Used for record notes, person notes and research-log sources, where URLs are
 * pasted inline rather than stored in a structured `link` field.
 */
export function LinkifiedText({ text, className, stopPropagation, linkClassName }: LinkifiedTextProps) {
  if (!text) return null;

  const parts = text.split(URL_SPLIT);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        IS_URL.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            title={part}
            onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
            className={
              linkClassName ??
              'text-[#800020] underline decoration-dotted underline-offset-2 hover:decoration-solid break-all'
            }
          >
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </span>
  );
}
