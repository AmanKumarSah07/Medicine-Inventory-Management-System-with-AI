import express from 'express';
import multer from 'multer';
import aiService from '../services/aiService.js';
import Medicine from '../models/Medicine.js';
import Order from '../models/Order.js';
import openfdaService from '../services/openfdaService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 1. AI Chatbot endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Aggregate some basic context for the AI
    const lowStockCount = await Medicine.countDocuments({ $expr: { $lte: ['$quantity', '$reorderLevel'] } });
    const totalMedicines = await Medicine.countDocuments();
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(3).populate('items.medicine');
    
    // Optionally fetch specific medicine info if mentioned in the query
    let specificMedsInfo = [];
    const keywords = message.split(' ');
    for (const keyword of keywords) {
      if (keyword.length > 4) { // Only search substantial names
        const meds = await Medicine.find({ name: { $regex: keyword, $options: 'i' } }).select('name quantity expiry category');
        specificMedsInfo.push(...meds);
      }
    }

    const contextData = {
      systemStatus: { totalMedicines, lowStockCount },
      recentActivity: recentOrders.map(o => ({ status: o.status, totalAmount: o.totalAmount })),
      relevantMedicinesFound: specificMedsInfo
    };

    const answer = await aiService.askDatabase(message, contextData);
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Predictive Restock
router.get('/predict/:medicineId', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.medicineId);
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    // In a real scenario, we'd pull historical usage over 30 days. For now, mock it.
    const medicineStats = {
      name: medicine.name,
      currentQuantity: medicine.quantity,
      averageDailyUsage: Math.floor(Math.random() * 10) + 1, // Mock value
      restockLevel: medicine.reorderLevel
    };

    const prediction = await aiService.predictRestock(medicineStats);
    res.json({ prediction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Invoice Scanner
router.post('/scan', upload.single('invoice'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    
    const result = await aiService.scanInvoice(req.file.buffer);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Drug Interactions
router.post('/interact', async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!medicines || !Array.isArray(medicines) || medicines.length < 1) {
      return res.status(400).json({ error: 'Array of medicine names required' });
    }

    // Fetch OpenFDA warnings for each drug
    let fdaContext = '';
    for (const med of medicines) {
      const info = await openfdaService.getDrugInfo(med);
      if (info && info.warnings && info.warnings.length > 0) {
        fdaContext += `\n[${med} Warnings]: ${info.warnings[0].substring(0, 500)}`;
      } else {
        fdaContext += `\n[${med} Warnings]: No specific FDA warnings found.`;
      }
    }

    const summary = await aiService.checkInteractions(medicines, fdaContext);
    res.json({ analysis: summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
