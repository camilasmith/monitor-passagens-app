require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Amadeus = require('amadeus');

const app = express();
const port = process.env.PORT || 10000;

// --- VERIFICAÇÃO DAS CHAVES DE API ---
if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    console.error("ERRO CRÍTICO: As variáveis de ambiente AMADEUS_API_KEY e AMADEUS_API_SECRET não foram definidas!");
    process.exit(1); // Encerra o servidor se as chaves não estiverem presentes
}

// --- CONFIGURAÇÃO DO CORS ---
// Permitindo de forma mais aberta para garantir a conexão.
// Em produção, você pode restringir para o seu domínio específico.
app.use(cors());

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
      currencyCode: 'BRL', // Especifica a moeda para Reais
      max: 20
    });
    
    res.json(response.result || response.data);

  } catch (error) {
    // Log do erro completo no servidor para depuração
    console.error("Erro detalhado na busca da Amadeus:", error);

    // Envia uma resposta de erro mais informativa para o frontend
    if (error.response) {
      // Erro vindo da API da Amadeus
      res.status(error.response.statusCode || 500).json({ 
        error: 'Falha na comunicação com a API de voos.', 
        details: error.description 
      });
    } else {
      // Outros erros (ex: rede)
      res.status(500).json({ 
        error: 'Erro interno no servidor.', 
        details: error.message 
      });
    }
  }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(port, () => {
  console.log(`Servidor seguro rodando na porta ${port}. Pronto para receber buscas!`);
});

