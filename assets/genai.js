import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { getBoard, isGameOver, message } from "./2048.js";

// Setup your API Key
let API_KEY = "";
let genAI = null;

async function getNextMove() {
  if (isGameOver()) {
    return;
  }

  if (!genAI) {
    API_KEY = document.getElementById("API_KEY").value;
    if (!API_KEY) {
      message("You need Gemini API Key to enable AI feature.")
      return;
    }
    genAI = new GoogleGenerativeAI(API_KEY);
  }

  const currentBoard = getBoard();
  try {
    message("Loading AI suggestion...")
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Use stable model version
      generationConfig: { responseMimeType: "application/json" } // Force JSON
    });

    // Convert the 2D array to a string for the prompt
    const boardString = JSON.stringify(currentBoard);

    const prompt = `
      You are an expert 2048 player. 
      Given this 4x4 grid: ${boardString}
      0 represents an empty cell.
      Analyze the best legal move (Up, Down, Left, or Right) to achieve the highest tile.
      Return ONLY a JSON object in this format: {"move": "Direction", "reason": "Short explanation"}
    `;

    // Send the request
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonResponse = JSON.parse(response.text());

    message(`AI suggests: ${jsonResponse.move}\nReason: ${jsonResponse.reason}`);
    return jsonResponse.move; // Returns "Up", "Down", etc.

  } catch (error) {
    message(`AI Move Error: ${error}`);
  }
}

window.getNextMove = getNextMove;