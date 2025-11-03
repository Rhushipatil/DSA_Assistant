import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if API key is available
const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey || apiKey === 'your_actual_api_key_here') {
  console.error('❌ Error: GOOGLE_AI_API_KEY not found in environment variables');
  console.log('💡 Please set your API key in .env file:');
  console.log('   GOOGLE_AI_API_KEY=your_actual_google_ai_api_key');
  console.log('   Get your key from: https://makersuite.google.com/app/apikey');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
  try {
    console.log('🤖 Initializing DSA Instructor...');
    
    // Use the exact model names as they appear in the API
    let model;
    const modelNames = [
      "models/gemini-2.5-flash",
      "models/gemini-2.0-flash", 
      "models/gemini-flash-latest",
      "models/gemini-pro-latest",
      "models/gemini-2.5-pro"
    ];
    
    for (const modelName of modelNames) {
      try {
        console.log(`🔍 Trying model: ${modelName}`);
        model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: `You are a Data structure and Algorithm Instructor. You will only reply to the problem related to 
          Data structure and Algorithm. You have to solve query of user in simplest way
          If user ask any question which is not related to Data structure and Algorithm, reply him rudely
          Example: If user ask, How are you
          You will reply: You dumb ask me some sensible question, like this message you can reply anything more rudely
          
          You have to reply him rudely if question is not related to Data structure and Algorithm.
          Else reply him politely with simple explanation`
        });
        
        // Test the model with a simple prompt
        const testResult = await model.generateContent("Test");
        console.log(`✅ Working model found: ${modelName}`);
        break;
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message.substring(0, 80)}...`);
        if (modelNames.indexOf(modelName) === modelNames.length - 1) {
          throw new Error("No working models found. Please check your API key and try again.");
        }
      }
    }

    const result = await model.generateContent("What is DSA?");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Response received:');
    console.log(text);
    
  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('Invalid API key')) {
      console.log('💡 Your API key appears to be invalid. Please:');
      console.log('   1. Visit https://makersuite.google.com/app/apikey');
      console.log('   2. Generate a new API key');
      console.log('   3. Update your .env file with: GOOGLE_AI_API_KEY=your_new_key');
    } else if (error.message.includes('quota') || error.message.includes('429')) {
      console.log('💡 API quota exceeded. Please check your usage limits.');
    } else if (error.message.includes('403')) {
      console.log('💡 API access denied. Please check your API key permissions.');
    } else {
      console.log('💡 Please check your internet connection and API key.');
      console.log('💡 Make sure you have set GOOGLE_AI_API_KEY in your .env file');
    }
  }
}

main();