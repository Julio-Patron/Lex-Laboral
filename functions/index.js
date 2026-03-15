import { onRequest } from "firebase-functions/v2/https";
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';

dotenv.config();

if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key');
const app = express();

app.use(cors({ origin: true, optionsSuccessStatus: 200 }));

// Webhook para procesar pagos
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send('Webhook Error: Invalid signature');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const plan = session.metadata?.plan;

    try {
      const userRef = db.collection('users').doc(userId);
      
      if (plan === 'audit') {
        await userRef.set({ credits: { audits: admin.firestore.FieldValue.increment(1) } }, { merge: true });
      } else if (plan === 'draft_basic') {
        await userRef.set({ credits: { draft_basic: admin.firestore.FieldValue.increment(1) } }, { merge: true });
      } else if (plan === 'draft_custom') {
        await userRef.set({ credits: { draft_custom: admin.firestore.FieldValue.increment(1) } }, { merge: true });
      } else if (plan === '3-months') {
        const activatedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        await userRef.set({ 
          isPremium: true, 
          licenseType: '3-months',
          activatedAt: admin.firestore.Timestamp.fromDate(activatedAt),
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          usage: { audits: 0, generations: 0, chats: 0 },
          updatedAt: admin.firestore.FieldValue.serverTimestamp() 
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating firestore:', error);
    }
  }
  res.json({ received: true });
});

app.use(express.json());

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.post('/api/create-checkout-session', async (req, res) => {
  const { userEmail, userId, plan } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: { plan: plan },
      line_items: [{ price: req.body.priceId || 'price_dummy', quantity: 1 }],
      mode: (plan === '3-months') ? 'subscription' : 'payment',
      success_url: `${process.env.CLIENT_URL || 'https://studio-6462708856-c0f94.web.app'}/#payment-success`,
      cancel_url: `${process.env.CLIENT_URL || 'https://studio-6462708856-c0f94.web.app'}/#payment-cancelled`,
    });
    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const SYSTEM_INSTRUCTION = `Eres "Lex Laboral", un motor de inteligencia jurídica de alto nivel en México especializado exclusivamente en Derecho Laboral Mexicano...`;
const MAIN_MODEL = "gemini-2.5-pro";
const FLASH_MODEL = "gemini-3-flash";

const getTodayString = () => new Date().toISOString().split('T')[0];

async function checkChatUsage(userId) {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) throw new Error("Usuario no encontrado");
  
  const userData = userDoc.data();
  const isPremiumValid = userData.isPremium && (!userData.expiresAt || userData.expiresAt.toDate() >= new Date());
  
  if (isPremiumValid) {
    const chatUsage = userData.usage?.chats || 0;
    if (chatUsage >= 100) throw new Error("Límite trimestral de chat alcanzado (100 consultas).");
    await userRef.update({ 'usage.chats': admin.firestore.FieldValue.increment(1) });
    return;
  }

  // Usuario Gratis: 2 al día
  const today = getTodayString();
  const dailyChats = userData.dailyUsage?.date === today ? (userData.dailyUsage?.chats || 0) : 0;
  
  if (dailyChats >= 2) throw new Error("Límite diario de chat gratuito alcanzado (2). Adquiera un plan para continuar.");
  
  await userRef.set({ dailyUsage: { date: today, chats: dailyChats + 1, calculators: userData.dailyUsage?.date === today ? userData.dailyUsage.calculators : 0 } }, { merge: true });
}

async function checkUsage(userId, type) {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) throw new Error("Usuario no encontrado");
  
  const userData = userDoc.data();
  const isPremiumValid = userData.isPremium && (!userData.expiresAt || userData.expiresAt.toDate() >= new Date());
  
  if (isPremiumValid) {
    const currentUsage = userData.usage?.[type === 'audits' ? 'audits' : 'generations'] || 0;
    if (currentUsage >= 50) throw new Error(`Límite trimestral alcanzado para ${type} (50).`);
    await userRef.update({ [`usage.${type === 'audits' ? 'audits' : 'generations'}`]: admin.firestore.FieldValue.increment(1) });
    return;
  }

  // Verificar créditos a la carta
  const credits = userData.credits?.[type] || 0;
  if (credits > 0) {
    await userRef.update({ [`credits.${type}`]: admin.firestore.FieldValue.increment(-1) });
    return;
  }
  
  throw new Error("Saldo insuficiente. Adquiera un crédito individual o el plan trimestral.");
}

app.post('/api/legal/chat', authenticateUser, async (req, res) => {
  const { history, message, useThinking, focusMode } = req.body;
  try {
    await checkChatUsage(req.user.uid);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: useThinking ? MAIN_MODEL : FLASH_MODEL, systemInstruction: SYSTEM_INSTRUCTION });
    const chat = model.startChat({ history: history.slice(-10).map(h => ({ role: h.role, parts: [{ text: h.text }] })) });
    const result = await chat.sendMessage(message);
    res.json({ text: (await result.response).text() });
  } catch (error) {
    if (error.message.includes('Límite') || error.message.includes('Saldo')) return res.status(403).json({ error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/legal/analyze', authenticateUser, async (req, res) => {
  const { files, prompt } = req.body;
  try {
    await checkUsage(req.user.uid, 'audits');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MAIN_MODEL, systemInstruction: SYSTEM_INSTRUCTION });
    const parts = files.map(f => ({ inlineData: { mimeType: f.mimeType, data: f.base64 } }));
    parts.push({ text: `Realice un Dictamen de Auditoría Integral exhaustivo. Petición: ${prompt}` });
    const result = await model.generateContent(parts);
    res.json({ text: (await result.response).text() });
  } catch (error) {
    if (error.message.includes('Límite') || error.message.includes('Saldo')) return res.status(403).json({ error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/legal/draft', authenticateUser, async (req, res) => {
  const { requirements, customInstructions } = req.body;
  try {
    await checkUsage(req.user.uid, customInstructions ? 'draft_custom' : 'draft_basic');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MAIN_MODEL, systemInstruction: SYSTEM_INSTRUCTION });
    const promptText = `TAREA: Proyecte instrumento jurídico.\n\nRequerimientos: ${requirements}\nInstrucciones extra: ${customInstructions || 'Ninguna'}`;
    const result = await model.generateContent(promptText);
    res.json({ text: (await result.response).text() });
  } catch (error) {
    if (error.message.includes('Límite') || error.message.includes('Saldo')) return res.status(403).json({ error: error.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/legal/calculator', authenticateUser, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    
    const isPremiumValid = userData.isPremium && (!userData.expiresAt || userData.expiresAt.toDate() >= new Date());
    if (!isPremiumValid) {
      const today = getTodayString();
      const dailyCalcs = userData.dailyUsage?.date === today ? (userData.dailyUsage?.calculators || 0) : 0;
      if (dailyCalcs >= 2) return res.status(403).json({ error: "Límite diario de calculadora gratuito alcanzado (2)." });
      await userRef.set({ dailyUsage: { date: today, calculators: dailyCalcs + 1, chats: userData.dailyUsage?.date === today ? userData.dailyUsage.chats : 0 } }, { merge: true });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

export const api = onRequest({ memory: "512MiB", timeoutSeconds: 60 }, app);
