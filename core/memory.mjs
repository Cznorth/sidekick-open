export function fuseRecall(rankings, { scope, limit = 8, rankConstant = 60 }) {
  const scores = new Map();
  for (const ranking of rankings) {
    const seen = new Set();
    let rank = 0;
    for (const hit of ranking) {
      if (hit.scope !== scope || seen.has(hit.ref)) continue;
      seen.add(hit.ref);
      const row = scores.get(hit.ref) ?? { hit, score: 0 };
      row.score += 1 / (rankConstant + ++rank);
      scores.set(hit.ref, row);
    }
  }
  return [...scores.values()].sort((left, right) => right.score - left.score).slice(0, limit);
}

export async function consolidate(store, { shard, revision, taskRevision, text }) {
  const previous = await store.read(shard);
  if (previous.revision !== revision || previous.taskRevision !== taskRevision) return { kind: 'conflict' };
  const archive = await store.archive(shard, previous);
  const written = await store.compareAndSwap(shard, { revision, taskRevision }, text);
  return written ? { kind: 'committed', archive } : { kind: 'conflict', archive };
}
