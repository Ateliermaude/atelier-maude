export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { email } = req.body ?? {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'missing_email' });
  }

  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return res.status(400).json({ error: 'invalid_email' });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  if (!apiKey || !groupId) {
    console.error('Missing MAILERLITE_API_KEY or MAILERLITE_GROUP_ID env vars');
    return res.status(500).json({ error: 'server_config_error' });
  }

  let mlRes, data;
  try {
    mlRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: trimmed,
        groups: [groupId],
        status: 'unconfirmed',
      }),
    });
    data = await mlRes.json();
  } catch (err) {
    console.error('MailerLite fetch error:', err);
    return res.status(500).json({ error: 'network_error' });
  }

  // 200 = subscriber updated (already existed), 201 = newly created
  if (mlRes.status === 200) {
    return res.status(200).json({ ok: true, already: true });
  }
  if (mlRes.status === 201) {
    return res.status(200).json({ ok: true, created: true });
  }

  // MailerLite validation error (e.g. 422)
  if (mlRes.status === 422) {
    const msg = data?.errors?.email?.[0] ?? data?.message ?? 'validation_error';
    return res.status(400).json({ error: 'validation_error', detail: msg });
  }

  console.error('MailerLite unexpected response:', mlRes.status, data);
  return res.status(500).json({ error: 'mailerlite_error' });
}
