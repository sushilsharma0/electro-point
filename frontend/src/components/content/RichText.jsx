import { Link } from 'react-router-dom';
import { interpolate, isSafeHref } from '@/lib/contentPages';

export function RichText({ text, vars, className }) {
  const raw = interpolate(text, vars).trim();
  if (!raw) return null;
  const blocks = raw.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const isList = lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line));
        if (isList) {
          return (
            <ul key={i}>
              {lines.map((line, j) => (
                <li key={j}>
                  <InlineText text={line.replace(/^[-*]\s+/, '')} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            <InlineText text={lines.join(' ')} />
          </p>
        );
      })}
    </div>
  );
}

function InlineText({ text }) {
  const parts = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match;
  let key = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const label = match[1];
    const href = match[2];
    if (isSafeHref(href)) {
      if (href.startsWith('/') && !href.startsWith('//')) {
        parts.push(
          <Link key={key++} to={href} className="text-accent hover:underline">
            {label}
          </Link>,
        );
      } else {
        parts.push(
          <a
            key={key++}
            href={href}
            className="text-accent hover:underline"
            {...(href.startsWith('http') ? { rel: 'noopener noreferrer' } : {})}
          >
            {label}
          </a>,
        );
      }
    } else {
      parts.push(label);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
