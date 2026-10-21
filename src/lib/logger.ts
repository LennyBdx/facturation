/**
 * Journalisation structurée (une ligne JSON par événement en production, lisible
 * en développement). Point unique à brancher sur un service de suivi des erreurs.
 */
type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const isProduction = process.env.NODE_ENV === "production";

function serializeError(err: unknown): Fields {
  if (err instanceof Error) {
    return { error: err.message, name: err.name, ...(isProduction ? {} : { stack: err.stack }), ...("digest" in err ? { digest: String(err.digest) } : {}) };
  }
  return { error: String(err) };
}

function write(level: Level, message: string, fields: Fields = {}) {
  if (process.env.NODE_ENV === "test" && level !== "error") return;
  const entry = { level, message, time: new Date().toISOString(), ...fields };
  const line = isProduction ? JSON.stringify(entry) : `[${level}] ${message}${Object.keys(fields).length ? ` ${JSON.stringify(fields)}` : ""}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, fields?: Fields) => write("debug", message, fields),
  info: (message: string, fields?: Fields) => write("info", message, fields),
  warn: (message: string, fields?: Fields) => write("warn", message, fields),
  error: (message: string, err?: unknown, fields?: Fields) => write("error", message, { ...fields, ...(err === undefined ? {} : serializeError(err)) }),
};
