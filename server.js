require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Amadeus = require('amadeus');

const app = express();
const port = process.env.PORT || 10000;

// --- CONFIGURAÇÃO DO CORS (A CORREÇÃO ESTÁ AQUI) ---
// Define qual site tem permissão para acessar este servidor.
const allowedOrigins = ['https://sr-monitor-de-voos.onrender.com'];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem 'origin' (como apps mobile ou Postman) e da nossa origem permitida
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pela política de CORS'));
    }
  }
};

// Aplica o middleware do CORS com as opções definidas
app.use(cors(corsOptions));


// --- CONFIGURAÇÃO DO AMADEUS ---
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET
});

// --- ROTA DA API ---
app.get('/api/search-flights', async (req, res) => {
  const { origin, destination, departureDate } = req.query;

  if (!origin || !destination || !departureDate) {
    return res.status(400).json({ error: 'Parâmetros origin, destination e departureDate são obrigatórios.' });
  }

  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: '1',
      nonStop: false,
      max: 20 // Limita o número de resultados para agilizar
    });
    
    // A Amadeus pode retornar um objeto com uma propriedade 'data' ou a resposta direta
    res.json(response.result || response.data);

  } catch (error) {
    console.error("Erro na busca da Amadeus:", error.response ? error.response.body : error.message);
    res.status(500).json({ error: 'Falha ao buscar ofertas de voos.', details: error.description });
  }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(port, () => {
  console.log(`Servidor seguro rodando na porta ${port}. Pronto para receber buscas!`);
});

