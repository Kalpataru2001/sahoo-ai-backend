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
        console.log("--- New Request Received ---");
        console.log("Body from Angular:", req.body);
        
        const userMessage = req.body.message;
        
        if (!userMessage) {
            throw new Error("Message from frontend is undefined or empty!");
        }

        console.log("Sending to Gemini:", userMessage);
        
        // Call the Gemini API
        const result = await model.generateContent(userMessage);
        const botResponse = await result.response.text();
        
        console.log("Gemini replied successfully!");
        res.json({ reply: botResponse });
    } catch (error) {
        console.error("❌ Error calling Gemini API:");
        console.error(error); 
        
        // Handle the Rate Limit (Too Many Requests) specifically
        if (error.status === 429) {
            return res.status(429).json({ error: "Whoa, we are talking too fast! Give my digital brain about 60 seconds to catch its breath." });
        }
        
        // Handle all other errors
        res.status(500).json({ error: "Brain disconnected. Try again later." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});