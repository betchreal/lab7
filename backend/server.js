const express = require('express');
const app = express();
const eventRoutes = require('./routes/events');
const PORT = process.env.PORT || 3000;

app.use('/api', eventRoutes);
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Сервер працює!');
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});
