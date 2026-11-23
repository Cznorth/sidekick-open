export function createWorldRouter(routes) {
  const rules = new Map(Object.entries(structuredClone(routes)));
  return function route(world, event, accept) {
    const policy = rules.get(world);
    if (!policy || !policy.types.includes(event.type) || typeof event.id !== 'string' || !event.id) return false;
    return accept({
      key: JSON.stringify([world, event.id]),
      destination: policy.destination,
      wake: policy.wake.includes(event.type),
      trust: 'external-data',
      type: event.type,
      data: structuredClone(event.data),
    });
  };
}
