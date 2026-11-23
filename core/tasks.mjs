const transitions = new Map(Object.entries({
  dispatched: { started: 'running', crashed: 'failed', cancelled: 'cancelled' },
  running: { question: 'waiting', limited: 'waiting', delivered: 'review', crashed: 'failed', cancelled: 'cancelled' },
  waiting: { resumed: 'running', crashed: 'failed', cancelled: 'cancelled' },
  review: { accepted: 'done', changes: 'running', cancelled: 'cancelled' },
}));

export const newTask = id => ({ id, state: 'pending', attempt: 0, sequence: 0, wait: null });

export function dispatch(task, expectedAttempt) {
  if (task.attempt !== expectedAttempt || !['pending', 'done', 'failed', 'cancelled'].includes(task.state)) return task;
  return { ...task, state: 'dispatched', attempt: task.attempt + 1, sequence: 0, wait: null };
}

export function applyTaskEvent(task, event) {
  if (event.attempt !== task.attempt || !Number.isSafeInteger(event.sequence) || event.sequence !== task.sequence + 1) return task;
  const allowed = transitions.get(task.state);
  const state = allowed && Object.hasOwn(allowed, event.kind) ? allowed[event.kind] : undefined;
  if (!state) return task;
  return { ...task, state, sequence: event.sequence, wait: state === 'waiting' ? event.kind : null };
}
