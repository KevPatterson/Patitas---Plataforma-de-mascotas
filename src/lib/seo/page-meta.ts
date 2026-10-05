type PageMeta = {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
};

function upsertMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    if (property) {
      element.setAttribute('property', name);
    } else {
      element.setAttribute('name', name);
    }
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

export function setPageMeta({ title, description, canonicalPath, image }: PageMeta) {
  document.title = title;
  upsertMeta('description', description);
  upsertMeta('og:title', title, true);
  upsertMeta('og:description', description, true);
  upsertMeta('twitter:title', title);
  upsertMeta('twitter:description', description);

  if (image) {
    upsertMeta('og:image', image, true);
    upsertMeta('twitter:image', image);
  }

  if (canonicalPath) {
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }

    canonical.href = `${window.location.origin}${canonicalPath}`;
  }
}