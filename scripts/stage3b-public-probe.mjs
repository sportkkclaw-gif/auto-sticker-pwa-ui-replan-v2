const work='work_stage3b_openai_20260524142621';
const bases=process.argv.slice(2);
const defaultBases=['http://127.0.0.1:4173','http://127.0.0.1:4305','https://organizing-zen-enlarge-while.trycloudflare.com','https://f74f011711413a.lhr.life'];
const targetBases=bases.length?bases:defaultBases;
const paths=[
  '/stage3b-create',
  `/stage3b-review/${work}`,
  `/stage3b-review/${work}/generation_manifest.json`,
  `/stage3b-review/${work}/provider_evidence.json`,
  `/stage3b-review/${work}/stage3b-line-stickers.zip`,
  `/api/stage3b-review/${work}/manifest`,
  `/api/stage3b-review/${work}/provider-evidence`,
];
for (const base of targetBases) {
  console.log('BASE', base);
  for (const p of paths) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15000);
    try {
      const r = await fetch(base + p, { signal: ac.signal, headers: { 'user-agent': 'stage3b-probe' }});
      const ct = r.headers.get('content-type') || '';
      const len = r.headers.get('content-length') || '';
      let extra = '';
      if (ct.includes('json')) {
        const j = await r.json().catch(() => null);
        if (j) extra = JSON.stringify({provider:j.provider,model:j.model,real:j.real_provider_output_count,fallback:j.fallback_image_count,no_new:j.no_new_openai_generation,images:j.generated_images?.length});
      } else if (p.endsWith('.zip')) {
        const ab = await r.arrayBuffer();
        extra = 'bytes=' + ab.byteLength + ' magic=' + Buffer.from(new Uint8Array(ab.slice(0,4))).toString('hex');
      } else {
        await r.arrayBuffer().catch(() => null);
      }
      console.log(r.status, p, ct, len, extra);
    } catch (e) {
      console.log('ERR', p, e.name || e.message);
    } finally {
      clearTimeout(t);
    }
  }
}
