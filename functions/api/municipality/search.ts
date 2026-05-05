import { json, safeJson } from '../../_shared';

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() || '';

  if (query.length < 2) {
    return json([]);
  }

  try {
    const response = await fetch('https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        obchodniJmeno: query,
        pravniForma: ['801'],
        start: 0,
        pocet: 10,
      }),
    });

    if (!response.ok) {
      return json([]);
    }

    const data = await safeJson(response);
    const results =
      data?.ekonomickeSubjekty?.map((entity: any) => ({
        name: entity.obchodniJmeno,
        ico: entity.ico,
        region: entity.sidlo?.nazevKraje || 'Česká republika',
        address: entity.sidlo?.textovaAdresa,
        kodObce: entity.sidlo?.kodObce,
        kodCastiObce: entity.sidlo?.kodCastiObce,
      })) || [];

    return json(results, {
      headers: {
        'cache-control': 'public, max-age=3600',
      },
    });
  } catch {
    return json([]);
  }
};