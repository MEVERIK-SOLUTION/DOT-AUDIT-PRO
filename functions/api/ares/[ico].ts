import { json, safeJson } from '../../_shared';

export const onRequestGet: PagesFunction = async ({ params }) => {
  const ico = params.ico;

  try {
    const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return json({ error: 'ARES unreachable' }, { status: response.status });
    }

    return json(await safeJson(response));
  } catch {
    return json({ error: 'Proxy error' }, { status: 500 });
  }
};