const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

// POST chatbot text to ML microservice and return predictions
exports.predictFromText = async (req, res) => {
  const { text, model, top_n } = req.body;

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: "Field 'text' is required and must be a non-empty string" });
  }

  const payload = { text: text.trim() };
  if (model) payload.model = model;
  if (top_n !== undefined) payload.top_n = top_n;

  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: 'ML service returned an error',
        details: data
      });
    }

    return res.json(data);
  } catch (err) {
    return res.status(503).json({
      error: 'ML service unavailable',
      details: err.message
    });
  }
};
