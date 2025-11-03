// backend.js - Node.js backend for handling DSA Instructor API calls
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module fixes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Already imported dotenv above

// Your API configuration
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || 'your_api_key_here';

// System instruction for the DSA instructor
const SYSTEM_INSTRUCTION = `You are a Data structure and Algorithm Instructor. You will only reply to the problem related to 
Data structure and Algorithm. You have to solve query of user in simplest way
If user ask any question which is not related to Data structure and Algorithm, reply him rudely
Example: If user ask, How are you
You will reply: You dumb ask me some sensible question, like this message you can reply anything more rudely

You have to reply him rudely if question is not related to Data structure and Algorithm.
Else reply him politely with simple explanation`;

// Route to serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// API endpoint to handle chat messages using cURL
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Generate the cURL command
        const curlCommand = generateCurlCommand(message);
        console.log('Executing cURL command:', curlCommand);

        // Execute the cURL command
        exec(curlCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error('cURL execution error:', error);
                return res.status(500).json({ 
                    error: 'Failed to get response from AI',
                    details: error.message 
                });
            }

            if (stderr) {
                console.error('cURL stderr:', stderr);
            }

            try {
                const response = JSON.parse(stdout);
                
                if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                    const aiResponse = response.candidates[0].content.parts[0].text;
                    res.json({ 
                        response: aiResponse,
                        curlCommand: curlCommand // Include the cURL command for reference
                    });
                } else {
                    console.error('Invalid API response:', response);
                    res.status(500).json({ error: 'Invalid response from AI service' });
                }
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Raw response:', stdout);
                res.status(500).json({ error: 'Failed to parse AI response' });
            }
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to generate cURL command
function generateCurlCommand(message) {
    // Check if API key is available
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
        throw new Error('API key not configured. Please set GOOGLE_AI_API_KEY in environment variables.');
    }
    
    // Use the working model
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: message
            }]
        }],
        systemInstruction: {
            parts: [{
                text: SYSTEM_INSTRUCTION
            }]
        }
    };

    // Escape quotes and create the cURL command
    const jsonData = JSON.stringify(requestBody).replace(/"/g, '\\"');
    
    const curlCommand = `curl -X POST "${apiUrl}" ` +
                      `-H "Content-Type: application/json" ` +
                      `-d "${jsonData}"`;
    
    return curlCommand;
}

// Endpoint to get cURL command without executing
app.post('/api/generate-curl', (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const curlCommand = generateCurlCommand(message);
        res.json({ curlCommand });
    } catch (error) {
        console.error('Error generating cURL command:', error);
        res.status(500).json({ error: 'Failed to generate cURL command' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 DSA Instructor backend running on http://localhost:${PORT}`);
    console.log(`📝 Frontend available at http://localhost:${PORT}`);
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`📋 cURL generator: http://localhost:${PORT}/api/generate-curl`);
});

export default app;