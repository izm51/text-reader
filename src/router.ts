export function navigate(query: string): void {
  const target = query ? `${location.pathname}${query.startsWith('?') ? query : `?${query}`}` : location.pathname;
  history.pushState({}, '', target);
  window.scrollTo(0, 0);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function currentParams(): URLSearchParams {
  return new URLSearchParams(location.search);
}
