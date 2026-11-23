export async function fastReply({ snapshot, question, tools, decide, signal, timeoutMs = 5000, maxRounds = 3 }) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000 ||
      !Number.isSafeInteger(maxRounds) || maxRounds < 1 || maxRounds > 10) throw new RangeError('invalid branch limits');
  const timer = new AbortController();
  const branch = signal ? AbortSignal.any([signal, timer.signal]) : timer.signal;
  const defer = reason => ({ kind: 'deferred', reason });
  const deadline = setTimeout(() => timer.abort(), timeoutMs);
  let onAbort;
  try {
    const context = structuredClone(snapshot);
    const handlers = tools.map(({ name, effects, schema, run }) => ({ name, effects: [...effects], schema: structuredClone(schema), run }));
    const toolTable = handlers.map(({ name, effects, schema }) => ({ name, effects, schema }));
    branch.throwIfAborted();
    const stopped = new Promise((resolve, reject) => {
      onAbort = () => reject(branch.reason);
      branch.addEventListener('abort', onAbort, { once: true });
    });
    const run = async () => {
      const nudge = { role: 'user', content: question };
      const tail = [];
      for (let round = 0; round < maxRounds; round++) {
        branch.throwIfAborted();
        const action = await decide({ messages: structuredClone([...context, nudge, ...tail]), tools: structuredClone(toolTable), signal: branch });
        branch.throwIfAborted();
        if (action.kind === 'answer' && typeof action.text === 'string' && action.text.trim()) {
          return { kind: 'answered', text: action.text };
        }
        if (action.kind !== 'tool') return defer('needs-main');
        const tool = handlers.find(candidate => candidate.name === action.name);
        if (!tool || tool.effects.length !== 1 || tool.effects[0] !== 'read') return defer('needs-main');
        const args = structuredClone(action.args);
        const result = await tool.run(structuredClone(args), { signal: branch });
        branch.throwIfAborted();
        tail.push({ role: 'assistant', call: { name: action.name, args } },
          { role: 'tool', name: action.name, result: structuredClone(result) });
      }
      return defer('round-limit');
    };
    return await Promise.race([stopped, run()]);
  } catch {
    return defer(branch.aborted ? 'aborted-or-timeout' : 'branch-error');
  } finally {
    clearTimeout(deadline);
    if (onAbort) branch.removeEventListener('abort', onAbort);
  }
}
