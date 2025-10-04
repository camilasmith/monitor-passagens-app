// --- BIBLIOTECAS NECESSÁRIAS ---
const express = require('express');
const Amadeus = require('amadeus');
const cors = require('cors');
require('dotenv').config();

// --- CONFIGURAÇÃO INICIAL DO SERVIDOR ---
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// --- ROTA DE TESTE ---
// 👉 Se acessar https://SEU-APP.onrender.com/api/ping
// Deve responder { status: "ok", msg: "Servidor rodando no Render!" }
app.get('/api/ping', (req, res) => {
  res.json({ status: "ok", msg: "Servidor rodando no Render!" });
});

// --- VALIDAÇÃO DAS CHAVES DA API ---
if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
  console.error("ERRO: As chaves da API da Amadeus (AMADEUS_API_KEY e AMADEUS_API_SECRET) não foram encontradas.");
  process.exit(1);
}

// --- CONEXÃO COM A AMADEUS ---
// 🔑 Sandbox (troque para 'production' se tiver credenciais aprovadas)
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET,
  hostname: 'test'
});

// --- ROTA DE BUSCA DE VOOS ---
app.get('/api/search-flights', async (req, res) => {
  const { origin, destination, departureDate } = req.query;

  if (!origin || !destination || !departureDate) {
    return res.status(400).json({ error: 'Origem, destino e data de partida são obrigatórios.' });
  }

  try {
    console.log(`Buscando voos de ${origin} para ${destination} em ${departureDate}...`);

    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: '1',
      max: 10,
      currencyCode: 'BRL'
    });

    const formattedOffers = response.data.map(offer => ({
      id: offer.id,
      price: offer.price.total,
      airline: offer.validatingAirlineCodes[0]
    }));

    res.json(formattedOffers);

  } catch (error) {
    console.error("Erro na chamada da API Amadeus:", error.description || error.message);
    res.status(500).json({
      error: 'Erro ao buscar voos na Amadeus.',
      details: error.description || error.message
    });
  }
});

// --- INICIA SERVIDOR ---
app.listen(port, () => {
  console.log(`Servidor seguro rodando na porta ${port}. Pronto para receber buscas!`);
});



