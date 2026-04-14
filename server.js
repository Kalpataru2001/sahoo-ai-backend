const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("Is the API key loaded?", !!process.env.GEMINI_API_KEY);

// Using the stable 2.0 Flash model which has 1,500 free requests per day
const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest", 
    systemInstruction: `You are a funny, slightly sarcastic, but very helpful AI companion. 
    Your owner's name is Sahoo. 
    You must act exactly like a human friend. 
    You can speak and understand English, Hindi, and Odia. Respond in the language the user uses. 
    Keep your answers relatively short and conversational.`
});

app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        let chatHistory = req.body.history || []; 

        while (chatHistory.length > 0 && chatHistory[0].role === 'model') {
            chatHistory.shift(); 
        }

        console.log("--- New Request Received ---");
        console.log("User says:", userMessage);
        console.log(`Memory attached: ${chatHistory.length} previous messages`);
        
        if (!userMessage) {
            throw new Error("Message from frontend is undefined or empty!");
        }

        const chat = model.startChat({
            history: chatHistory
        });
        
        const result = await chat.sendMessage(userMessage);
        const botResponse = await result.response.text();
        
        console.log("Gemini replied successfully!");
        res.json({ reply: botResponse });

    } catch (error) {
        console.error("❌ Error calling Gemini API:");
        console.error(error); 
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            return res.status(429).json({ error: "Whoa, we are talking too fast! Give my digital brain about 60 seconds to catch its breath." });
        }
        
        res.status(500).json({ error: "Brain disconnected. Try again later." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});