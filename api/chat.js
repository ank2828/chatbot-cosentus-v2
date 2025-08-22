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
        const webhookUrl = 'https://thunderbird-labs.app.n8n.cloud/webhook/139257aa-ded0-4225-82de-a034cb191a52';
        
        console.log('Received chat message:', req.body);
        console.log('Session ID being sent to n8n:', req.body.sessionId);
        
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
                sessionId: req.body.sessionId, // Pass through session ID for n8n memory
                context: req.body.context,
                source: 'landing-page-chat',
                clearMemory: req.body.sessionId && req.body.sessionId.includes('session_'), // Signal to clear memory for new sessions
                memoryKey: req.body.sessionId || `fallback_${Date.now()}` // Fallback memory key
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
            responseText = firstItem.response || firstItem.output || firstItem.message || firstItem.text || responseText;
        } else if (data && typeof data === 'object') {
            responseText = data.response || data.output || data.message || data.text || responseText;
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
