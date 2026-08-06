import { fileURLToPath } from 'url';
import path from 'path';

export default function fileDirName(metaUrl: string) {
  const __filename = fileURLToPath(metaUrl);
  const __dirname = path.dirname(__filename);
  return { __filename, __dirname };
}

export function formatError(err: any): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as any).message);
  }
  return String(err);
}
