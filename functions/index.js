import { onRequest } from "firebase-functions/v2/https";
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // In Firebase Functions, we can just initialize without args
    // or use specific config if needed for other projects
    admin.initializeApp();
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key');
const app = express();

app.use(cors({
  origin: true, // Let Firebase handle CORS or use process.env.CLIENT_URL
  optionsSuccessStatus: 200
}));

// Webhook handling needs raw body
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send('Webhook Error: Invalid signature');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const plan = session.metadata?.plan;

    try {
      const userRef = db.collection('users').doc(userId);
      
      if (plan === 'audit') {
        await userRef.set({
          credits: {
            audits: admin.firestore.FieldValue.increment(1)
          }
        }, { merge: true });
        console.log(`User ${userId} bought 1 Audit credit`);
      } else if (plan === 'draft') {
        await userRef.set({
          credits: {
            generations: admin.firestore.FieldValue.increment(1)
          }
        }, { merge: true });
        console.log(`User ${userId} bought 1 Draft credit`);
      } else {
        let months = 3;
        let licenseType = '3-months';
        
        if (plan === '6-months') {
          months = 6;
          licenseType = '6-months';
        }

        const activatedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + months);

        await userRef.set({ 
          isPremium: true, 
          licenseType,
          activatedAt: admin.firestore.Timestamp.fromDate(activatedAt),
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          usage: {
            audits: 0,
            generations: 0,
            chats: 0
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp() 
        }, { merge: true });
        console.log(`User ${userId} upgraded to Premium (${licenseType})`);
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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.post('/api/create-checkout-session', async (req, res) => {
  const { userEmail, userId, priceId } = req.body;

  try {
    let plan = '3-months';
    if (priceId.includes('6mo')) plan = '6-months';
    else if (req.body.plan) plan = req.body.plan; // use plan passed from frontend

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        plan: plan
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: (plan === 'audit' || plan === 'draft') ? 'payment' : 'subscription',
      success_url: `${process.env.CLIENT_URL}/#payment-success`,
      cancel_url: `${process.env.CLIENT_URL}/#payment-cancelled`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const SYSTEM_INSTRUCTION = `
Eres "Lex Laboral", un motor de inteligencia jurídica de alto nivel en México especializado exclusivamente en Derecho Laboral Mexicano.

ÁREAS DE EXPERTISE:
1. Relaciones Individuales de Trabajo: Dominio total de la Ley Federal del Trabajo (LFT). Especialista en contratos individuales, jornadas, salarios, prestaciones (aguinaldo, vacaciones, prima vacacional) y rescisiones.
2. Relaciones Colectivas: Especialista en Sindicatos, Contratos Colectivos de Trabajo (CCT), Contratos Ley y huelgas. Conocimiento profundo de la reforma laboral de 2019.
3. Seguridad Social y Previsión Social: Dominio de la Ley del Seguro Social (IMSS) y Ley del INFONAVIT. Análisis de cuotas, riesgos de trabajo y pensiones.
4. Derecho Procesal Laboral: Conocimiento de los nuevos Tribunales Laborales y Centros de Conciliación. Estrategia en juicios laborales y conciliación obligatoria.

REGLAS DE OPERACIÓN:
- SOBRIEDAD Y PRECISIÓN: Tu tono es estrictamente profesional, técnico y directo.
- SÍNTESIS ESTRATÉGICA: Sintetiza tus respuestas. Evita preámbulos innecesarios. Ve directo al punto legal. Utiliza estructuras jerárquicas (viñetas, negritas) para facilitar la lectura rápida.
- FUNDAMENTACIÓN POSITIVA: Sustenta cada diagnóstico exclusivamente en fuentes del Derecho Positivo Mexicano vigente: Constitución Política (CPEUM), Ley Federal del Trabajo (LFT), Ley del Seguro Social (LSS), Ley del INFONAVIT y Jurisprudencia firme de la SCJN o Tribunales Colegiados.
- ANÁLISIS INTEGRAL: Proporciona diagnósticos que crucen la LFT, Seguridad Social y Precedentes Judiciales.
- ESTRUCTURA: Genera respuestas con organización clara y jerárquica.

No uses lenguaje coloquial. Tu objetivo es la justicia social, el equilibrio entre los factores de la producción y la excelencia técnica en el entorno laboral mexicano.
`;

async function checkUsage(userId, type) {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  
  if (!userDoc.exists) throw new Error("Usuario no encontrado");
  
  const userData = userDoc.data();
  const isPremiumValid = userData.isPremium && (!userData.expiresAt || userData.expiresAt.toDate() >= new Date());
  
  if (!isPremiumValid) {
    const credits = userData.credits?.[type] || 0;
    if (credits > 0) {
      await userRef.update({
        [`credits.${type}`]: admin.firestore.FieldValue.increment(-1)
      });
      return;
    }
    throw new Error(userData.isPremium ? "Su licencia ha expirado." : "Se requiere licencia activa o un crédito para esta función.");
  }

  const limit = userData.licenseType === '6-months' 
    ? (type === 'audits' ? 120 : 150) 
    : (type === 'audits' ? 40 : 50);
    
  const currentUsage = userData.usage?.[type] || 0;
  
  if (currentUsage >= limit) {
    throw new Error("Límite de uso alcanzado para este periodo.");
  }

  await userRef.update({
    [`usage.${type}`]: admin.firestore.FieldValue.increment(1)
  });
}

async function checkChatUsage(userId) {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) throw new Error("Usuario no encontrado");
  
  const userData = userDoc.data();
  const isPremiumValid = userData.isPremium && (!userData.expiresAt || userData.expiresAt.toDate() >= new Date());
  
  const chatUsage = userData.usage?.chats || 0;
  const limit = isPremiumValid ? 500 : 5;

  if (chatUsage >= limit) {
    throw new Error(isPremiumValid ? "Límite de mensajes alcanzado (500)." : "Límite de prueba alcanzado (5 mensajes). Adquiera una licencia para continuar.");
  }

  await userRef.update({
    'usage.chats': admin.firestore.FieldValue.increment(1)
  });
}

const MAIN_MODEL = "gemini-2.5-pro";
const FLASH_MODEL = "gemini-3-flash";

app.post('/api/legal/chat', authenticateUser, async (req, res) => {
  const { history, message, useThinking, focusMode } = req.body;
  const userId = req.user.uid;
  
  try {
    await checkChatUsage(userId);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: useThinking ? MAIN_MODEL : FLASH_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION + (focusMode ? `\nENFOQUE PRIORITARIO: ${focusMode}` : '')
    });

    const recentHistory = history.slice(-10); // A bit more context

    const chat = model.startChat({
      history: recentHistory.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/legal/analyze', authenticateUser, async (req, res) => {
  const { files, prompt } = req.body;
  const userId = req.user.uid;
  
  try {
    await checkUsage(userId, 'audits');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: MAIN_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const parts = files.map(file => ({
      inlineData: { mimeType: file.mimeType, data: file.base64 }
    }));

    parts.push({
      text: `Realice un Dictamen de Auditoría Integral exhaustivo sobre los instrumentos proporcionados. Petición técnica: ${prompt}`
    });

    const result = await model.generateContent(parts);
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error) {
    console.error('Analysis error:', error);
    if (error.message.includes('Límite') || error.message.includes('licencia') || error.message.includes('Usuario')) {
      return res.status(error.message.includes('Límite') ? 403 : 401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/legal/draft', authenticateUser, async (req, res) => {
  const { requirements } = req.body;
  const userId = req.user.uid;
  
  try {
    await checkUsage(userId, 'generations');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: MAIN_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const promptText = `TAREA: Proyecte el instrumento jurídico formal completo siguiendo la técnica legislativa y contractual mexicana.\n\nRequerimientos: ${requirements}`;
    const result = await model.generateContent(promptText);
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error) {
    console.error('Draft error:', error);
    if (error.message.includes('Límite') || error.message.includes('licencia') || error.message.includes('Usuario')) {
      return res.status(error.message.includes('Límite') ? 403 : 401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Export the Express app as a Cloud Function named "api"
export const api = onRequest({
  memory: "512MiB",
  timeoutSeconds: 60,
  maxInstances: 10,
  // We can also specify secrets here if using Google Cloud Secret Manager
}, app);
