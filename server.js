require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Amadeus = require('amadeus');

const app = express();
const port = process.env.PORT || 10000;

if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    console.error("ERRO CRÍTICO: As variáveis de ambiente da Amadeus não foram definidas!");
    process.exit(1);
}

app.use(cors());

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET
});

// ROTA UNIFICADA E INTELIGENTE PARA BUSCAS
app.get('/api/search-flights', async (req, res) => {
  const { origin, destination, departureDate, returnDate } = req.query;

  if (!origin) {
    return res.status(400).json({ error: 'O parâmetro de origem é obrigatório.' });
  }

  // --- MODO 1: BUSCA DE ROTA ESPECÍFICA (se o destino for fornecido) ---
  if (destination) {
      try {
        const searchParams = {
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate: departureDate || new Date().toISOString().split('T')[0],
          adults: '1',
          nonStop: false,
          currencyCode: 'BRL',
          max: 20
        };
        
        if (returnDate) {
          searchParams.returnDate = returnDate;
        }
        
        console.log(`Buscando voo:`, searchParams);
        const response = await amadeus.shopping.flightOffersSearch.get(searchParams);
        return res.json(response.result || response.data);

      } catch (error) {
        console.error("Erro na busca de rota específica:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: 'Falha ao buscar ofertas de voos.', details: error.description });
      }
  } 
  // --- MODO 2: EXPLORAR OFERTAS (se o destino NÃO for fornecido) ---
  else {
      try {
        // CORREÇÃO APLICADA AQUI: O parâmetro correto é 'origin'
        const searchParams = {
            origin: origin, 
            maxPrice: 5000 
        };
        if (departureDate) {
            searchParams.departureDate = departureDate;
        }

        console.log(`Explorando ofertas a partir de:`, searchParams);
        const response = await amadeus.shopping.flightDestinationsSearch.get(searchParams);
        return res.json(response.result || response.data);

      } catch (error) {
          console.error("Erro na busca de exploração:", error.response ? error.response.data : error.message);
          return res.status(500).json({ error: 'Falha ao explorar ofertas.', details: error.description });
      }
  }
});


app.listen(port, () => {
  console.log(`Servidor seguro rodando na porta ${port}.`);
});

