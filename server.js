const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Proxy endpoint for webhook (to handle CORS)
app.post('/api/chat', async (req, res) => {
    try {
        // n8n webhook URL
        const webhookUrl = 'https://thunderbird-labs.app.n8n.cloud/webhook/139257aa-ded0-4225-82de-a034cb191a52';
        
        console.log('Received chat message:', req.body);
        
        // Send message directly to n8n webhook
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
                source: 'landing-page-chat'
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
        
        // Handle both array and object responses from n8n
        let responseText = 'Thank you for your message.';
        
        if (Array.isArray(data) && data.length > 0) {
            // n8n returns an array - get the first item's response
            const firstItem = data[0];
            responseText = firstItem.response || firstItem.output || firstItem.message || firstItem.text || responseText;
        } else if (data && typeof data === 'object') {
            // Direct object response
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
});

app.listen(PORT, () => {
    console.log(`🚀 Medical RCM Landing Page running at http://localhost:${PORT}`);
    console.log('🎨 Beautiful modern design ready!');
    console.log('💬 Chat widget with n8n webhook integration active');
    console.log('Press Ctrl+C to stop the server');
});
