import { json, safeJson } from '../../../_shared';

export const onRequestGet: PagesFunction = async ({ params }) => {
  const kodObce = params.kodObce;

  try {
    const response = await fetch(
      `https://vdb.czso.cz/vdbvo2/api/v1/vystup-objekt?id=5121&p_id=DEM0004&k_id=3049&u_id=${kodObce}`,
      {
        headers: { Accept: 'application/json' },
      },
    );

    if (!response.ok) {
      return json({ population: 500 });
    }

    const data = await safeJson(response);
    const value = data?.vystup?.data?.[0]?.hodnota || 500;
    return json({ population: Math.round(value) });
  } catch {
    return json({ population: 500 });
  }
};