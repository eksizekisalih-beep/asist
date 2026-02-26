const { GoogleGenerativeAI } = require("@google/generative-ai");

// Literal key for absolute debug certainty
const genAI = new GoogleGenerativeAI("AIzaSyB2chJuGE96yLrPUlhc3mxUcTC58BWxZXo");

async function listModels() {
  try {
    const list = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Model initialized successfully.");
    
    // Testing a very simple list
    console.log("Requesting model list...");
    // The SDK might not have .listModels() directly on genAI in all versions, 
    // but usually it does. Let's try.
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyB2chJuGE96yLrPUlhc3mxUcTC58BWxZXo`);
        const data = await response.json();
        console.log("API Response (direct fetch):", JSON.stringify(data, null, 2));
    } catch (e) {
        console.log("Fetch error:", e.message);
    }

  } catch (error) {
    console.error("Listing Error:", error.message);
  }
}

listModels();
