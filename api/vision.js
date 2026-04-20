export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const apiKey = process.env.VISION_API_KEY;

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: image },
          features: [
            { type: 'TEXT_DETECTION', maxResults: 50 },
            { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
          ]
        }]
      })
    }
  );

  const data = await response.json();

  // 에러 체크
  if (data.error) {
    return res.status(400).json({ error: data.error.message });
  }
  if (data.responses && data.responses[0] && data.responses[0].error) {
    return res.status(400).json({ error: data.responses[0].error.message });
  }

  return res.status(200).json(data);
}
