import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
if (process.env.GITHUB_ACTIONS !== 'true' && !['1','true'].includes(process.env.CF_PAGES ?? '')) {
  throw new Error('Remote-only: site checks/builds require GitHub Actions or Cloudflare Pages CI.');
}
for (const kind of ['qi','costseg','states']) {
  const source = new URL('../../data/normalized/' + kind + '/', import.meta.url);
  const target = new URL('../src/content/' + kind + '/', import.meta.url);
  await rm(target, { recursive:true, force:true });
  await mkdir(target, { recursive:true });
  for (const name of await readdir(source)) {
    if (!name.endsWith('.json')) continue;
    const raw = await readFile(new URL(name, source), 'utf8');
    JSON.parse(raw);
    await writeFile(new URL(name, target), raw);
  }
}
