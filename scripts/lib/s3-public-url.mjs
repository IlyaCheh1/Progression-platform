/**
 * Public object URL helpers for Selectel / path-style S3.
 *
 * Selectel public domain: https://<bucket-uuid>.selstorage.ru/<object_key>
 * Path-style API:         https://s3.<pool>.storage.selcloud.ru/<bucket>/<object_key>
 */

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** True when the public base already identifies the bucket (no /bucket/ in path). */
export function isVirtualHostedPublicBase(publicBase, bucket) {
  if (!publicBase) return false;
  const host = hostnameOf(publicBase);
  if (!host) return false;
  if (host.endsWith(".selstorage.ru") || host.endsWith(".selcdn.ru")) return true;
  if (bucket) {
    const b = bucket.toLowerCase();
    if (host === b || host.startsWith(`${b}.`)) return true;
  }
  return false;
}

/**
 * @param {{ publicBase?: string, endpoint: string, bucket: string, key: string }} opts
 */
export function buildPublicObjectUrl({ publicBase, endpoint, bucket, key }) {
  const keyNorm = String(key || "").replace(/^\/+/, "");
  if (publicBase) {
    const base = publicBase.replace(/\/$/, "");
    if (isVirtualHostedPublicBase(publicBase, bucket)) {
      return `${base}/${keyNorm}`;
    }
    return `${base}/${bucket}/${keyNorm}`;
  }
  return `${endpoint.replace(/\/$/, "")}/${bucket}/${keyNorm}`;
}

/**
 * Base URL for a media prefix (no trailing slash), e.g. .../media/hero
 * @param {{ publicBase?: string, endpoint: string, bucket: string, prefix: string }} opts
 */
export function buildMediaBaseUrl({ publicBase, endpoint, bucket, prefix }) {
  const prefixNorm = String(prefix || "").replace(/^\/+|\/+$/g, "");
  return buildPublicObjectUrl({ publicBase, endpoint, bucket, key: prefixNorm });
}
