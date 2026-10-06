import { handleUpload } from '@vercel/blob/client';
import { getAdminSession } from '../../lib/admin-auth.js';

function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
}

export default async function handler(req, res) {
  noCache(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const session = getAdminSession(req);
        if (!session) throw new Error('Owner session required.');

        const safePath = String(pathname || '');
        if (!safePath.startsWith('rebecca-media/')) {
          throw new Error('Invalid media path.');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ owner: 'Rebecca', scope: 'rc-03-media' })
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('RC-03 media upload completed:', blob.pathname);
      }
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('RC-03 upload token failed:', error?.message || error);
    return res.status(400).json({ error: error?.message || 'Could not authorize this upload.' });
  }
}
