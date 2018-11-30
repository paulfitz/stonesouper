export function completeQuery(seed: {[key: string]: any}, filt: any, skip?: string) {
  for (const key of Object.keys(filt)) {
    const parts = key.split('_');
    if (filt[key].length > 0 && key !== skip) {
      if (parts.length === 2) {
        if (!seed['tags']) { seed['tags'] = {}; }
        seed['tags'][parts[1]] = filt[key];
      } else {
        seed[key] = filt[key];
      }
    }
  }
  if (skip) {
    const parts = skip.split('_');
    if (parts.length === 2) {
      seed.parents = [parts[1]];
      return '/api/tag';
    }
  }
  return skip ? `/api/${skip}` : '/api/map';
}

