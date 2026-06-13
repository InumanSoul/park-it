const BAD = ['fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'nazi', 'rape'];

export default {
  async fetch(req, env) {
    const h = cors(env.ALLOW_ORIGIN || '*');
    if (req.method === 'OPTIONS') return new Response(null, { headers: h });

    const url = new URL(req.url);
    if (url.pathname !== '/scores') return json({ error: 'not found' }, 404, h);

    if (req.method === 'GET') {
      const mode = url.searchParams.get('mode') === 'hard' ? 'hard' : 'normal';
      const limit = Math.min(parseInt(url.searchParams.get('limit')) || 10, 50);
      const { results } = await env.DB.prepare(
        'SELECT nickname, level, stars FROM scores WHERE difficulty = ? ORDER BY level DESC, stars DESC, created_at ASC LIMIT ?'
      ).bind(mode, limit).all();
      return json(results, 200, h);
    }

    if (req.method === 'POST') {
      const ip = req.headers.get('CF-Connecting-IP') || '0';
      const hits = parseInt(await env.RL.get(`rl:${ip}`)) || 0;
      if (hits >= 10) return json({ error: 'slow down' }, 429, h);
      await env.RL.put(`rl:${ip}`, String(hits + 1), { expirationTtl: 60 });

      let body;
      try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400, h); }

      let nick = sanitize(body.nickname);
      if (!nick) return json({ error: 'nickname required' }, 400, h);
      if (BAD.some(w => nick.toLowerCase().includes(w))) nick = '???';

      const difficulty = body.difficulty === 'hard' ? 'hard' : 'normal';
      const level = Math.floor(Number(body.level));
      const stars = Math.floor(Number(body.stars));
      if (!(level >= 1 && level <= 200)) return json({ error: 'bad level' }, 400, h);
      if (!(stars >= 0 && stars <= level * 3)) return json({ error: 'bad stars' }, 400, h);

      await env.DB.prepare(
        'INSERT INTO scores (nickname, level, stars, difficulty, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(nick, level, stars, difficulty, Date.now()).run();
      return json({ ok: true, nickname: nick }, 200, h);
    }

    return json({ error: 'method not allowed' }, 405, h);
  },
};

function sanitize(raw) {
  return String(raw ?? '').replace(/[<>]/g, '').replace(/[\x00-\x1f]/g, '').trim().slice(0, 12);
}

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status, h) {
  return new Response(JSON.stringify(data), { status, headers: { ...h, 'Content-Type': 'application/json' } });
}
