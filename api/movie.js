import { getMovieSources, getShowSources } from '@movie-web/providers';

export default async function handler(req, res) {
  // 1. Enable CORS so your frontend can talk to this backend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Get parameters from the URL
    const { tmdbId, type = 'movie', season = 1, episode = 1 } = req.query;

    if (!tmdbId) {
      return res.status(400).json({ error: 'tmdbId is required' });
    }

    console.log(`[API] Fetching sources for TMDB ID: ${tmdbId}, Type: ${type}`);

    // 3. Fetch the direct stream from movie-web providers
    const result = type === 'movie' 
      ? await getMovieSources({ id: tmdbId.toString() })
      : await getShowSources({ id: tmdbId.toString(), season: Number(season), episode: Number(episode) });

    // 4. Check if we actually got any streams
    if (!result || !result.stream || result.stream.length === 0) {
      console.warn(`[API] No sources found for TMDB ID: ${tmdbId}`);
      return res.status(404).json({ 
        error: 'No sources found for this media', 
        provider: result?.provider || 'unknown' 
      });
    }

    // 5. Find the best quality source
    const source = result.stream.find(s => s.quality === '1080p') || 
                   result.stream.find(s => s.quality === '720p') || 
                   result.stream[0];

    console.log(`[API] Successfully found source: ${source.type} from ${result.provider}`);

    // 6. Return the direct video URL to your frontend!
    return res.status(200).json({
      success: true,
      url: source.url,
      type: source.type, // Will be 'hls' or 'mp4'
      provider: result.provider
    });

  } catch (error) {
    // 7. CATCH ALL ERRORS so the function never silently crashes
    console.error('[API] CRITICAL ERROR:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch stream', 
      details: error.message 
    });
  }
}
