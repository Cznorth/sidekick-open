import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorldRouter } from './world.mjs';
import { fastReply } from './fast-reply.mjs';
import { applyTaskEvent, dispatch, newTask } from './tasks.mjs';
import { consolidate, fuseRecall } from './memory.mjs';

test('World applies its own wake policy and routes a copy as untrusted data', () => {
  const route = createWorldRouter({ inbox: { destination: 'intake', types: ['note'], wake: [] } });
  const event = { id: 'note-one', type: 'note', wake: true, data: { text: 'Synthetic note' } };
  assert.equal(route('other', event, assert.fail), false);
  assert.equal(route('inbox', { ...event, type: 'other' }, assert.fail), false);
  assert.equal(route('inbox', event, accepted => {
    assert.equal(accepted.wake, false);
    assert.equal(accepted.trust, 'external-data');
    assert.equal(accepted.destination, 'intake');
    accepted.data.text = 'changed';
    return true;
  }), true);
  assert.equal(event.data.text, 'Synthetic note');
});

test('fast reply keeps the prefix and tool order, and never calls a write handler', async () => {
  const snapshot = [{ role: 'system', content: { text: 'stable' } }];
  const tools = [
    { name: 'read', effects: ['read'], run: () => 'ready' },
    { name: 'write', effects: ['read', 'write'], run: assert.fail },
  ];
  const answer = await fastReply({ snapshot, question: 'Status?', tools, decide: ({ messages, tools: table }) => {
    assert.deepEqual(table.map(tool => tool.name), ['read', 'write']);
    assert.deepEqual(messages[0], snapshot[0]);
    messages[0].content.text = 'local mutation';
    return messages.at(-1).role === 'tool'
      ? { kind: 'answer', text: messages.at(-1).result }
      : { kind: 'tool', name: 'read' };
  } });
  assert.deepEqual(answer, { kind: 'answered', text: 'ready' });
  assert.equal(snapshot[0].content.text, 'stable');
  assert.equal((await fastReply({ snapshot, question: 'Change it', tools, decide: () => ({ kind: 'tool', name: 'write' }) })).reason, 'needs-main');
});

test('fast reply yields on timeout even if the model adapter has not returned', async () => {
  const result = await fastReply({ snapshot: [], question: 'Status?', tools: [], timeoutMs: 15, decide: () => new Promise(() => {}) });
  assert.equal(result.reason, 'aborted-or-timeout');
});

test('task limits are resumable, delivery requires review, and stale attempts cannot win', () => {
  let task = dispatch(newTask('workshop'), 0);
  assert.equal(applyTaskEvent(task, { kind: 'delivered', attempt: 1, sequence: 2 }), task);
  for (const [index, kind] of ['started', 'limited'].entries()) task = applyTaskEvent(task, { kind, attempt: 1, sequence: index + 1 });
  assert.equal(task.wait, 'limited');
  assert.equal(dispatch(task, 1), task);
  task = applyTaskEvent(task, { kind: 'resumed', attempt: 1, sequence: 3 });
  task = applyTaskEvent(task, { kind: 'delivered', attempt: 1, sequence: 4 });
  assert.equal(task.state, 'review');
  task = applyTaskEvent(task, { kind: 'accepted', attempt: 1, sequence: 5 });
  assert.equal(task.state, 'done');
  task = dispatch(task, 1);
  assert.equal(applyTaskEvent(task, { kind: 'started', attempt: 1, sequence: 1 }), task);
});

test('hybrid recall boosts overlap and neither leaks other shards nor counts duplicates', () => {
  const lexical = { ref: 'lexical', scope: 'assistant' };
  const overlap = { ref: 'overlap', scope: 'assistant' };
  const ranking = fuseRecall([[lexical, lexical, overlap], [{ ref: 'hidden', scope: 'intake' }, overlap]], { scope: 'assistant' });
  assert.deepEqual(ranking.map(row => row.hit.ref), ['overlap', 'lexical']);
  assert.equal(ranking[1].score, 1 / 61);
});

test('nightly consolidation archives before CAS and preserves concurrent updates', async () => {
  const previous = { revision: 1, taskRevision: 2, text: 'Original synthetic note' };
  const actions = [];
  const store = {
    read: () => previous,
    archive: (_, snapshot) => { assert.equal(snapshot, previous); actions.push('archive'); return 'archive-demo'; },
    compareAndSwap: (_, expected) => { assert.equal(expected.taskRevision, 2); actions.push('cas'); return false; },
  };
  const next = { shard: 'assistant', revision: 1, taskRevision: 2, text: 'Compacted note' };
  assert.deepEqual(await consolidate(store, next), { kind: 'conflict', archive: 'archive-demo' });
  assert.deepEqual(actions, ['archive', 'cas']);
  await assert.rejects(consolidate({ ...store, archive: () => { throw new Error('archive unavailable'); }, compareAndSwap: assert.fail }, next));
});
