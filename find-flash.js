
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyB2chJuGE96yLrPUlhc3mxUcTC58BWxZXo");

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyB2chJuGE96yLrPUlhc3mxUcTC58BWxZXo`);
    const data = await response.json();
    console.log("FULL MODEL LIST:");
    data.models.forEach(m => {
      // Only log if it's a flash model
      if (m.name.includes("flash")) {
        console.log(`- ${m.name}`);
      }
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
