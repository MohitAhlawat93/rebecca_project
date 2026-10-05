import { getEffectiveRebeccaData } from '../lib/admin-store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=120');

  const effective = await getEffectiveRebeccaData();
  return res.status(200).json({
    data: effective.data,
    version: effective.version,
    updatedAt: effective.updatedAt,
    source: effective.storeMode
  });
}
