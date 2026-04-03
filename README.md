# Medical Inventory Management System with AI 🏥✨

An advanced, end-to-end Medical Inventory Management platform designed to streamline supply chains, eliminate drug shortages, and proactively ensure patient safety. This application leverages the MERN stack (MongoDB, Express, React, Node.js) and integrates cutting-edge Artificial Intelligence capabilities powered by **HuggingFace**, **Tesseract OCR**, and **OpenFDA**.

---

## 🌟 Key Features

### Core Inventory Management
* **Role-Based Workspaces**: Distinct, customized dashboard views for Admins, Inventory Managers, Doctors/Nurses, and Logistics Suppliers.
* **Instant Dispensing & Tracking**: Doctors can instantly dispense available medication, dynamically depleting stock and updating system-wide alerts.
* **Audit Logs**: Deep activity logging that tracks who ordered, dispensed, or approved every item.

### 🧠 Next-Generation AI Integration

Our platform doesn't just store data; it actively interprets it to save time and lives.

#### 1. Predictive Restocking (Supply Chain AI)
Instead of waiting for stock to hit 0, the AI connects to historical MongoDB consumption data to forecast depletion rates. It provides priority-sorted restock warnings, allowing inventory managers to order drugs *before* the hospital runs out.

#### 2. Hybrid AI Invoice Scanning (OCR + LLM)
Say goodbye to manual data entry.
* **Tesseract OCR** reads the text directly from uploaded images of supplier invoices.
* **HuggingFace LLMs** structure that raw text into pristine JSON payloads.
* The system automatically parses the `{medicine, quantity, expiry}` and stages it for one-click inventory addition.

#### 3. OpenFDA Drug Interaction Checks
Patient safety is paramount. When a doctor selects a drug for dispensing, a realtime "AI Safety Check" fetches the latest side-effect warnings directly from the United States **OpenFDA Public API**. A HuggingFace Language Model reads the dense medical documentation and summarizes the critical contraindications into a single warning paragraph.

#### 4. Natural Language Database Assistant
Managers can use a built-in chat UI to interrogate their database organically (e.g. "What medicines are low on stock right now?"). The AI interprets the backend logs and provides immediate qualitative insights.

---

## 🚀 Installation & Setup

### Prerequisites
* **Node.js** (v18+)
* **MongoDB** (Local instance or Atlas Cluster)
* **HuggingFace API Key** (Free from huggingface.co)

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/AmanKumarSah07/Medicine-Inventory-Management-System-with-AI.git
cd Medicine-Inventory-Management-System-with-AI
\`\`\`

### 2. Configure the Backend
\`\`\`bash
cd backend
npm install
\`\`\`
Rename `.env.example` to `.env` (or create a new `.env` file) and include your credentials:
\`\`\`env
# backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medical_inventory
HUGGINGFACE_API_KEY="your_huggingface_token"
OPENFDA_API_URL=https://api.fda.gov/drug/label.json
\`\`\`
Start the Node server:
\`\`\`bash
npm run dev
\`\`\`

### 3. Configure the Frontend
In a new terminal window:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Navigate to `http://localhost:5173` to see the application live!

---

## 🛠 Technology Stack
* **Frontend**: React, Vite, Tailwind CSS, Framer Motion
* **Backend**: Node.js, Express.js
* **Database**: MongoDB & Mongoose
* **AI/ML Infrastructure**: `@huggingface/inference`, `tesseract.js`
* **External APIs**: [OpenFDA](https://open.fda.gov/)

## 📝 Demo Login Instructions
Because this system requires role-based authentication to view different dashboards, the following 'Quick Users' are seeded into the application for testing:
* **Admin**: `Aman` (Password: `12345678`)
* **Inventory Manager**: `Ben` (Password: `1234`)
* **Doctor/Nurse**: `Chloe` (Password: `1234`)
* **Supplier**: `SupplyBot` (Password: `1234`)
