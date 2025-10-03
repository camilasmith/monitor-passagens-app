// --- BIBLIOTECAS NECESSÁRIAS ---
// Estas são as "ferramentas" que nosso servidor usa para funcionar.
const express = require('express'); // Para criar o servidor web.
const Amadeus = require('amadeus');   // A biblioteca oficial da Amadeus para se conectar à API.
const cors = require('cors');        // Permite que nosso app no Netlify converse com este servidor.
require('dotenv').config();          // Carrega as chaves secretas do arquivo .env.

// --- CONFIGURAÇÃO INICIAL DO SERVIDOR ---
const app = express();
const port = process.env.PORT || 3000; // Define a porta onde o servidor vai operar.

// Habilita o CORS para segurança e para permitir a comunicação entre Netlify e Render.
app.use(cors());

// --- VALIDAÇÃO DAS CHAVES DA API ---
// Verifica se as chaves da Amadeus foram configuradas corretamente no ambiente.
// Se não estiverem, o servidor não vai iniciar e dará um aviso claro.
if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
  console.error("ERRO: As chaves da API da Amadeus (AMADEUS_API_KEY e AMADEUS_API_SECRET) não foram encontradas.");
  console.error("Por favor, verifique se o arquivo .env existe e está configurado corretamente.");
  process.exit(1); // Encerra o processo se as chaves não existirem.
}

// --- CONEXÃO COM A AMADEUS ---
// Inicia a conexão com a Amadeus usando as chaves secretas.
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET
});

// --- ROTA DE BUSCA DE VOOS (A "PONTE" PRINCIPAL) ---
// Quando o app (index.html) chamar a URL /api/search-flights, esta função será executada.
app.get('/api/search-flights', async (req, res) => {
  const { origin, destination, departureDate } = req.query;

  // Validação para garantir que os dados mínimos foram enviados.
  if (!origin || !destination || !departureDate) {
    return res.status(400).json({ error: 'Origem, destino e data de partida são obrigatórios.' });
  }

  try {
    // --- CHAMADA REAL PARA A API DA AMADEUS ---
    console.log(`Buscando voos de ${origin} para ${destination} em ${departureDate}...`);
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: '1',
      max: 10, // Pede as 10 melhores ofertas.
      currencyCode: 'BRL' // Pede os preços em Reais.
    });

    // --- FORMATAÇÃO DOS DADOS PARA O NOSSO APP ---
    // A resposta da Amadeus é muito complexa. Aqui, extraímos apenas o que nos interessa.
    const formattedOffers = response.data.map(offer => ({
      id: offer.id,
      price: offer.price.total,
      airline: offer.validatingAirlineCodes[0], // Código da Cia Aérea, ex: 'TP'
      // Adicionar mais dados no futuro, se necessário (duração, escalas, etc.)
    }));

    // Envia os dados formatados de volta para o app.
    res.json(formattedOffers);

  } catch (error) {
    // Se a Amadeus retornar um erro, ele será capturado e exibido no console do servidor.
    console.error("Erro na chamada da API Amadeus:", error.description || error.message);
    res.status(500).json({ error: 'Erro ao buscar voos na Amadeus.', details: error.description });
  }
});


// Inicia o servidor para que ele comece a "ouvir" as chamadas do app.
app.listen(port, () => {
  console.log(`Servidor seguro rodando na porta ${port}. Pronto para receber buscas!`);
});

