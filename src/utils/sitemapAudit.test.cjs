const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync(`${__dirname}/sitemapAudit.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = new Module(`${__dirname}/sitemapAudit.ts`);
loaded._compile(compiled.outputText, loaded.filename);
const { sitemapRequestUrl, summarizeSitemapUrls } = loaded.exports;
const edge = 'https://example.supabase.co/functions/v1/sitemap-static';

test('new index categories are queried without a fixed category list', () => {
  const url = new URL(sitemapRequestUrl('https://cuiz.in/sitemaps/category/business-finance/sitemap.xml', edge));
  assert.equal(url.searchParams.get('type'), 'category');
  assert.equal(url.searchParams.get('category'), 'business-finance');
});
test('unknown nested sitemap paths are not misreported as the index', () => {
  const child = 'https://cuiz.in/sitemaps/questions/page-2.xml';
  assert.equal(sitemapRequestUrl(child, edge), child);
});
test('question coverage deduplicates IDs across alternative URLs and excludes answers', () => {
  const id = '00000000-0000-0000-0000-000000000001';
  const urls = [`https://cuiz.in/quiz/question/${id}/history/test`, `https://cuiz.in/quiz/question/${id}/history/ancient/test`, `https://cuiz.in/answer/${id}/test`];
  assert.equal(summarizeSitemapUrls([...urls, urls[0]], 2).questionCount, 1);
  assert.equal(summarizeSitemapUrls([...urls, urls[0]], 2).duplicateUrls, 1);
  assert.equal(summarizeSitemapUrls(urls, 2).missingCount, 1);
});
test('coverage counts beyond the Supabase 1000-row default', () => {
  const urls = Array.from({ length: 12533 }, (_, index) => `https://cuiz.in/quiz/question/00000000-0000-0000-0000-${String(index).padStart(12, '0')}/science/test`);
  assert.equal(summarizeSitemapUrls(urls, 12533).questionCount, 12533);
  assert.equal(summarizeSitemapUrls(urls, 12533).missingCount, 0);
});
test('unavailable database count is unknown, not zero', () => {
  assert.equal(summarizeSitemapUrls([], null).missingCount, null);
});