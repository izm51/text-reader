import { addDocument } from './db';
import { detectFormat, deriveTitle } from './parser';

export async function importFiles(files: FileList | File[]): Promise<number[]> {
  const ids: number[] = [];
  for (const file of Array.from(files)) {
    if (!file || file.size === 0) continue;
    const content = await file.text();
    const format = detectFormat(file.name);
    const title = deriveTitle(file.name, content);
    const id = await addDocument({ title, content, format });
    ids.push(id);
  }
  return ids;
}

export async function importRawText(
  text: string,
  filename = 'pasted.txt',
): Promise<number> {
  const format = detectFormat(filename);
  const title = deriveTitle(filename, text);
  return addDocument({ title, content: text, format });
}
