onst express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(bodyParser.json());

// Rota GET
app.get('/api/data', (req, res) => {
  res.json({ message: 'GET funcionando no Render!' });
});

// Rota POST
app.post('/api/data', (req, res) => {
  const body = req.body;
  console.log('Recebido:', body);
  res.json({ message: 'POST funcionando no Render!', data: body });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
