import { HfInference } from '@huggingface/inference';
import { createWorker } from 'tesseract.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Configure HuggingFace
let hf;
if (process.env.HUGGINGFACE_API_KEY) {
  hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
} else {
  logger.warn('HUGGINGFACE_API_KEY is not defined. AI endpoints will return mock data or fail.');
}

// Recommended fast Mistral or Llama model for text tasks
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';

class AIService {
  
  /**
   * Interact with the Database Chatbot
   */
  async askDatabase(query, contextData) {
    if (!hf) throw new Error('HuggingFace API Key missing');
    
    // Construct a focused system prompt
    const prompt = `
    System: You are an intelligent AI Assistant for a Medical Inventory Management System. 
    You have been provided with the following live context data from the database:
    ${JSON.stringify(contextData, null, 2)}
    
    User Query: "${query}"
    
    Rule: Provide a highly concise, helpful, and direct answer based ONLY on the context data above. Do not hallucinate inventory that doesn't exist.
    `;

    try {
      const result = await hf.textGeneration({
        model: HF_MODEL,
        inputs: prompt,
        parameters: { max_new_tokens: 500, return_full_text: false }
      });
      return result.generated_text.trim();
    } catch (error) {
      logger.error('Error in askDatabase:', error);
      throw error;
    }
  }

  /**
   * Predict Restock needs based on order history
   */
  async predictRestock(medicineStats) {
    if (!hf) throw new Error('HuggingFace API Key missing');

    const prompt = `
    System: You are a supply chain AI. Analyze the following medicine consumption data:
    ${JSON.stringify(medicineStats, null, 2)}
    
    Calculate roughly how many days of stock are left, and recommend a reorder date. 
    Format your response as a strict JSON object: { "estimatedDaysLeft": number, "recommendation": "string", "urgency": "High" | "Medium" | "Low" }
    Do not output any markdown or conversational text, ONLY VALID JSON.
    `;

    try {
      const result = await hf.textGeneration({
        model: HF_MODEL,
        inputs: prompt,
        parameters: { max_new_tokens: 300, return_full_text: false }
      });
      
      // Cleanup any potential markdown blocks the LLM might have returned
      let cleanJson = result.generated_text.trim();
      if (cleanJson.startsWith('\`\`\`json')) cleanJson = cleanJson.replace(/\`\`\`json/, '');
      if (cleanJson.endsWith('\`\`\`')) cleanJson = cleanJson.replace(/\`\`\`$/, '');
      
      return JSON.parse(cleanJson.trim());
    } catch (error) {
      logger.error('Error in predictRestock:', error);
      // Fallback
      return { estimatedDaysLeft: 7, recommendation: "AI parsing failed. Check manually.", urgency: "Medium" };
    }
  }

  /**
   * Scan Invoice using OCR + LLM
   */
  async scanInvoice(imageBuffer) {
    if (!hf) throw new Error('HuggingFace API Key missing');

    try {
      logger.info('Starting OCR on uploaded invoice...');
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageBuffer);
      const rawText = ret.data.text;
      await worker.terminate();
      
      logger.info('OCR Complete. Passing to LLM for structuring...');

      const prompt = `
      System: You are an intelligent data extraction AI. Look at the following raw OCR text extracted from a medical supplier invoice:
      
      RAW TEXT:
      ---
      ${rawText.substring(0, 3000)} // Ensure we don't exceed token limits
      ---
      
      Extract the medicines listed in this invoice. 
      Return a STRICT JSON array of objects with these exact keys: "name" (string), "quantity" (number), "expiry" (string, format YYYY-MM-DD if found, else null). 
      Example: [ {"name": "Paracetamol", "quantity": 100, "expiry": "2025-12-01"} ]
      ONLY OUTPUT VALID JSON.
      `;

      const result = await hf.textGeneration({
        model: HF_MODEL,
        inputs: prompt,
        parameters: { max_new_tokens: 500, return_full_text: false }
      });

      let jsonStr = result.generated_text.trim();
      if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.replace(/\`\`\`json/, '');
      if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.replace(/\`\`\`$/, '');
      
      return { 
        extractedItems: JSON.parse(jsonStr.trim()), 
        rawOcrText: rawText 
      };

    } catch (error) {
      logger.error('Error in scanInvoice:', error);
      throw error;
    }
  }

  /**
   * Check interactions using OpenFDA inputs
   */
  async checkInteractions(medicinesList, fdaContext) {
    if (!hf) throw new Error('HuggingFace API Key missing');

    const prompt = `
    System: You are a Clinical Pharmacist AI Assistant.
    The doctor is attempting to dispense the following medicines together:
    ${medicinesList.join(', ')}
    
    Here is the OpenFDA context and known warnings for these drugs:
    ${fdaContext}
    
    Please provide a concise, 1-paragraph summary of any serious drug-drug interactions or contraindications. If none are known from the text, state "No major interactions noted."
    `;

    try {
      const result = await hf.textGeneration({
        model: HF_MODEL,
        inputs: prompt,
        parameters: { max_new_tokens: 300, return_full_text: false }
      });
      return result.generated_text.trim();
    } catch (error) {
      logger.error('Error in checkInteractions:', error);
      throw error;
    }
  }
}

const aiService = new AIService();
export default aiService;
