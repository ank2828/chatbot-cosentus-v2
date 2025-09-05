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

        console.log('Webhook response status:', response.status);
        console.log('Webhook response headers:', response.headers.get('content-type'));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Webhook error response:', errorText);
            throw new Error(`Webhook responded with status: ${response.status} - ${errorText}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
                console.log('Webhook JSON response:', data);
            } catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                const textResponse = await response.text();
                console.log('Raw response text:', textResponse);
                throw new Error('Invalid JSON response from webhook');
            }
        } else {
            // Not JSON, treat as text
            const textResponse = await response.text();
            console.log('Webhook text response:', textResponse);
            
            // Try to parse as JSON anyway (some APIs don't set correct content-type)
            try {
                data = JSON.parse(textResponse);
                console.log('Successfully parsed text as JSON:', data);
            } catch (parseError) {
                console.error('Could not parse response as JSON:', parseError);
                // Use the raw text as the response
                data = { output: textResponse };
            }
        }

        let responseText = 'Thank you for your message.';
        
        // Handle your specific format: [{"output": "text"}]
        if (Array.isArray(data) && data.length > 0) {
            const firstItem = data[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
                responseText = firstItem.output || firstItem.response || firstItem.message || firstItem.text || responseText;
            } else {
                responseText = firstItem || responseText; // Direct string in array
            }
        } else if (data && typeof data === 'object') {
            responseText = data.output || data.response || data.message || data.text || responseText;
        } else if (typeof data === 'string') {
            responseText = data;
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
