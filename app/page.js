import { readFile } from 'fs/promises';
import path from 'path';
import LegacyPortal from '../components/LegacyPortal';

export default async function HomePage() {
  const htmlPath = path.join(process.cwd(), 'index.html');
  const sourceHtml = await readFile(htmlPath, 'utf8');

  return <LegacyPortal sourceHtml={sourceHtml} />;
}
