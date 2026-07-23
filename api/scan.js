export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const { domain } = req.query;

  if (!domain) {
    return res.status(400).json({ error: 'Domain parameter is required.' });
  }

  // Sanitize and validate domain
  let cleanDomain = domain.trim().toLowerCase();
  cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
  cleanDomain = cleanDomain.replace(/\/+$/, '');
  cleanDomain = cleanDomain.replace(/^www\./, '');

  const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}(?::[0-9]{1,5})?(\/.*)?$/i;
  if (!domainRegex.test(cleanDomain)) {
    return res.status(400).json({ error: 'Invalid domain format supplied.' });
  }

  const apiKey = process.env.RAPIDAPI;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: RAPIDAPI_KEY missing.' });
  }

  const startTime = Date.now();

  try {
    const apiResponse = await fetch(`https://subdomain-scan1.p.rapidapi.com/?domain=${encodeURIComponent(cleanDomain)}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'subdomain-scan1.p.rapidapi.com'
      }
    });

    const latency = Date.now() - startTime;

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return res.status(apiResponse.status).json({ 
        error: `Upstream API error (${apiResponse.status}): ${errorText || apiResponse.statusText}` 
      });
    }

    const data = await apiResponse.json();
    
    // Attach metadata
    const enrichedResponse = {
      domain: cleanDomain,
      scannedAt: new Date().toISOString(),
      latencyMs: latency,
      results: data
    };

    return.status(200).json(enrichedResponse);
  } catch (error) {
    return.status(500).json({ 
      error: 'Failed to communicate with intelligence network.', 
      details: error.message 
    });
  }
}
