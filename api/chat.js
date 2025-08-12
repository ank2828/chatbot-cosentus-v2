export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const webhookUrl = 'https://thunderbird-labs.app.n8n.cloud/webhook/08176b32-96eb-482d-8fe8-afbc7d957755';
        
        console.log('Received chat message:', req.body);
        
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: req.body.message,
                timestamp: req.body.timestamp,
                userId: req.body.userId,
                context: req.body.context,
                source: 'landing-page-chat'
            })
        });

        if (!response.ok) {
            throw new Error(`Webhook responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Webhook response:', data);

        let responseText = 'Thank you for your message.';
        
        if (Array.isArray(data) && data.length > 0) {
            const firstItem = data[0];
            responseText = firstItem.response || firstItem.message || firstItem.text || responseText;
        } else if (data && typeof data === 'object') {
            responseText = data.response || data.message || data.text || responseText;
        }

        res.json({
            response: responseText,
            timestamp: new Date().toISOString(),
            status: 'success'
        });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            error: 'Failed to process request',
            response: 'I apologize, but I\'m currently experiencing technical difficulties. Please try again later or contact our support team directly.'
        });
    }
}
