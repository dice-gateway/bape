// ARQUIVO: netlify/functions/createPagamento.js

const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

exports.handler = async (event, context) => {
  // Apenas aceita requisições POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount, description } = JSON.parse(event.body);

    // Validação simples dos dados recebidos
    if (!amount || typeof amount !== 'number' || amount < 0) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Valor inválido.' }) };
    }

    const newPayment = {
      amount,
      description: description || 'Pagamento PIX',
      status: 'pending', // Sempre começa como pendente
      createdAt: new Date().toISOString(),
    };

    await client.connect();
    const database = client.db('nome_do_seu_banco'); // <-- MUDE para o nome do seu banco
    const collection = database.collection('pagamentos'); // <-- MUDE para o nome da sua coleção

    await collection.insertOne(newPayment);

    return {
      statusCode: 201, // 201 significa "Created"
      body: JSON.stringify({ message: 'Pagamento criado com sucesso!' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erro ao criar pagamento.' }),
    };
  } finally {
    await client.close();
  }
};
```**Atenção:** Lembre-se de trocar `'nome_do_seu_banco'` e `'pagamentos'` pelos nomes corretos do seu MongoDB Atlas.

**2. Verifique o Arquivo `netlify.toml`**

Garanta que na raiz do seu projeto (`bape`) existe o arquivo `netlify.toml` com o seguinte conteúdo. Ele diz à Netlify onde encontrar a pasta de funções.

```toml
# ARQUIVO: netlify.toml

[functions]
  directory = "netlify/functions/"
