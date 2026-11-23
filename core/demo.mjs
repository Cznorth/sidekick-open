import { createWorldRouter } from './world.mjs';
import { fastReply } from './fast-reply.mjs';
import { applyTaskEvent, dispatch, newTask } from './tasks.mjs';
import { fuseRecall, consolidate } from './memory.mjs';

const route = createWorldRouter({ inbox: { destination: 'intake', types: ['note'], wake: [] } });
const accepted = new Set();
const accept = event => {
  if (accepted.has(event.key)) return false;
  accepted.add(event.key);
  console.log('World:', event.destination, event.trust, `wake=${event.wake}`);
  return true;
};
const note = { id: 'demo-note', type: 'note', data: 'A synthetic workshop note' };
route('inbox', note, accept);
console.log('Replay accepted:', route('inbox', note, accept));

let task = dispatch(newTask('workshop'), 0);
for (const [index, kind] of ['started', 'limited', 'resumed', 'delivered', 'accepted'].entries()) {
  task = applyTaskEvent(task, { kind, attempt: 1, sequence: index + 1 });
  console.log('Task:', task.state, task.wait ?? '');
}

const keyword = [{ ref: 'workshop', scope: 'assistant' }];
const semantic = [{ ref: 'raw-note', scope: 'intake' }, { ref: 'workshop', scope: 'assistant' }];
const hits = fuseRecall([keyword, semantic], { scope: 'assistant' });
const answer = await fastReply({
  snapshot: [{ role: 'system', content: 'Synthetic example.' }],
  question: 'What happened to the workshop task?',
  tools: [{ name: 'status', effects: ['read'], run: () => ({ status: task.state, recall: hits.map(row => row.hit.ref) }) }],
  decide: ({ messages }) => messages.at(-1).role === 'tool'
    ? { kind: 'answer', text: `Workshop task: ${messages.at(-1).result.status}.` }
    : { kind: 'tool', name: 'status' },
});
console.log('Fast reply:', answer.text);

let memory = { revision: 3, taskRevision: 1, text: 'Workshop scheduled. Workshop scheduled.' };
const archive = [];
const store = {
  read: () => ({ ...memory }),
  archive: (shard, previous) => archive.push({ shard, previous }),
  compareAndSwap: (shard, expected, text) => {
    if (expected.revision !== memory.revision || expected.taskRevision !== memory.taskRevision) return false;
    memory = { ...memory, text, revision: memory.revision + 1 };
    return true;
  },
};
console.log('Nightly Dream:', await consolidate(store, { shard: 'assistant', revision: 3, taskRevision: 1, text: 'Workshop accepted.' }));
