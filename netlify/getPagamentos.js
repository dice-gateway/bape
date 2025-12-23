// netlify/functions/getPagamentos.js

const { MongoClient } = require('mongodb');

// ATENÇÃO: A string de conexão NUNCA fica aqui.
// Vamos usar Variáveis de Ambiente.
const mongoUri = process.env.MONGO_URI;

exports.handler = async (event, context) => {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const database = client.db('nome_do_seu_banco'); // <-- Mude para o nome do seu banco de dados
    const collection = database.collection('pagamentos'); // <-- Mude para o nome da sua coleção (tabela)

    const pagamentos = await collection.find({}).toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(pagamentos),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Falha ao conectar com o banco de dados.' }),
    };
  } finally {
    await client.close();
  }
};
