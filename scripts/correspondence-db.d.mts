export interface CorrespondenceStatement {
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
  run(...params: unknown[]): { changes: number };
}

export interface CorrespondenceDb {
  pragma(source: string, options?: Record<string, unknown>): unknown;
  prepare(source: string): CorrespondenceStatement;
}

export function getDbPath(): string;
export function getAttachmentsDir(): string;
export function getDb(): CorrespondenceDb;
export function closeDb(): void;
