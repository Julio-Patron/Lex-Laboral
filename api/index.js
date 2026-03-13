
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
let db;

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  optionsSuccessStatus: 200
}));

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const config = {
      projectId: process.env.FIREBASE_PROJECT_ID,
    };
    
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      config.credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    }
    
    admin.initializeApp(config);
    db = admin.firestore();
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
} else {
  db = admin.firestore();
}

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
    
    let months = 3;
    let licenseType = '3-months';
    
    if (session.metadata?.plan === '6-months') {
      months = 6;
      licenseType = '6-months';
    }

    const activatedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    try {
      const userRef = db.collection('users').doc(userId);
      await userRef.set({ 
        isPremium: true, 
        licenseType,
        activatedAt: admin.firestore.Timestamp.fromDate(activatedAt),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        usage: {
          audits: 0,
          generations: 0
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      }, { merge: true });
      console.log(`User ${userId} upgraded to Premium (${licenseType})`);
    } catch (error) {
      console.error('Error updating firestore:', error);
    }
  }

  res.json({ received: true });
});

app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
  const { userEmail, userId, priceId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        plan: priceId.includes('6mo') ? '6-months' : '3-months'
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
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
  if (!userData.isPremium) throw new Error("Se requiere licencia activa");
  
  if (userData.expiresAt && userData.expiresAt.toDate() < new Date()) {
    throw new Error("Su licencia ha expirado");
  }

  const limit = userData.licenseType === '6-months' 
    ? (type === 'audits' ? 100 : 200) 
    : (type === 'audits' ? 50 : 100);
    
  const currentUsage = userData.usage?.[type] || 0;
  
  if (currentUsage >= limit) {
    throw new Error("Límite de uso alcanzado para este periodo");
  }

  await userRef.update({
    [`usage.${type}`]: admin.firestore.FieldValue.increment(1)
  });
}

app.post('/api/legal/chat', async (req, res) => {
  const { history, message, useThinking, focusMode, userId } = req.body;
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = "gemini-1.5-pro";
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION + (focusMode ? `\nENFOQUE PRIORITARIO: ${focusMode}` : '')
    });

    const chat = model.startChat({
      history: history.map(h => ({
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

app.post('/api/legal/analyze', async (req, res) => {
  const { files, prompt, userId } = req.body;
  
  try {
    await checkUsage(userId, 'audits');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
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

app.post('/api/legal/draft', async (req, res) => {
  const { requirements, userId } = req.body;
  
  try {
    await checkUsage(userId, 'generations');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
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

export default app;
