function upsertMeta(property: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(property: string): void {
  document.head.querySelector(`meta[property="${property}"]`)?.remove();
}

export function setArticleMeta(title: string): void {
  upsertMeta('og:type', 'article');
  upsertMeta('og:title', title);
}

export function clearArticleMeta(): void {
  removeMeta('og:type');
  removeMeta('og:title');
}
