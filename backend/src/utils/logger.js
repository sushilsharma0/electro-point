const silent = process.env.NODE_ENV === 'test';
const color = Boolean(process.stdout?.isTTY) && process.env.NO_COLOR !== '1';

const ANSI = {
  dim: '\x1b[90m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

const LEVEL = {
  info: { label: 'INFO ', paint: ANSI.cyan },
  warn: { label: 'WARN ', paint: ANSI.yellow },
  error: { label: 'ERROR', paint: ANSI.red },
};

function stamp() {
  return new Date().toISOString().slice(11, 23);
}

function paint(code, text) {
  if (!color) return text;
  return `${code}${text}${ANSI.reset}`;
}

function extra(details) {
  if (details == null || details === '') return '';
  if (details instanceof Error) {
    const stack = details.stack && process.env.NODE_ENV !== 'production' ? `\n${details.stack}` : '';
    return details.message && details.message !== details ? ` ${details.message}${stack}` : stack;
  }
  if (typeof details === 'string') return ` ${details}`;
  try {
    return ` ${JSON.stringify(details)}`;
  } catch {
    return '';
  }
}

function write(stream, level, message, details) {
  if (silent) return;
  const meta = LEVEL[level];
  const time = paint(ANSI.dim, stamp());
  const tag = paint(meta.paint, meta.label);
  stream.write(`${time}  ${tag}  ${message}${extra(details)}\n`);
}

export const logger = {
  info(message, details) {
    write(process.stdout, 'info', message, details);
  },
  warn(message, details) {
    write(process.stderr, 'warn', message, details);
  },
  error(message, details) {
    write(process.stderr, 'error', message, details);
  },
};

export function requestLogger(req, res, next) {
  if (silent) return next();
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(0)}ms`;
    if (res.statusCode >= 500) return;
    if (res.statusCode >= 400) return;
    logger.info(line);
  });
  next();
}

export default logger;
