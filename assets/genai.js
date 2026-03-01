import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { getBoard, message } from "./2048.js";

let genAI = null;
let chatSession = null;

// This function handles the "setup" only when needed
function initializeAI() {
  const apiKeyInput = document.getElementById('API_KEY');
  const key = apiKeyInput.value.trim();

  if (!key) {
    message("Please enter an API Key first!");
    return false;
  }

  try {
    genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: "You are a 2048 game solver. The user will send a 4x4 JSON array. Analyze the board and return ONLY JSON: {\"move\": \"Up\"|\"Down\"|\"Left\"|\"Right\", \"confidence\": 0-1}.",
      generationConfig: { responseMimeType: "application/json" }
    });

    chatSession = model.startChat();
    return true;
  } catch (err) {
    message("Invalid API Key format.");
    return false;
  }
}

async function getNextMove() {
  // 1. Ensure AI is initialized with the current input value
  if (!chatSession && !initializeAI()) return null;

  const boardData = getBoard();
  message("AI is thinking...");

  try {
    const result = await chatSession.sendMessage(JSON.stringify(boardData));
    const data = JSON.parse(result.response.text());

    message(`AI suggests moving: ${data.move} (${Math.round(data.confidence * 100)}% confident)`);
    return data.move;
  } catch (error) {
    // If the key was revoked or expired, reset so user can try a new one
    if (error.message.includes("403") || error.message.includes("401")) {
      genAI = null;
      chatSession = null;
    }
    message(`AI Error: ${error.message}`);
    return null;
  }
}

// Expose to window so HTML buttons can see it
window.getNextMove = getNextMove;