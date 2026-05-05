import { type Env, json, safeJson } from '../../_shared';

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const ico = params.ico;
  const token = env.HLIDAC_STATU_TOKEN;

  if (!token) {
    return json({ score: 0, flags: [] });
  }

  try {
    const response = await fetch(`https://api.hlidacstatu.cz/Api/v2/osoba/stats/${ico}`, {
      headers: { Authorization: `Token ${token}` },
    });

    if (!response.ok) {
      return json({ score: 0, flags: [] });
    }

    return json((await safeJson(response)) ?? { score: 0, flags: [] });
  } catch {
    return json({ score: 0, flags: [] });
  }
};