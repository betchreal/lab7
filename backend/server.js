const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let events = [];

app.get('/', (req, res) => {
    res.send('Сервер працює!');
});

app.post('/api/events', (req, res) => {
    const event = req.body;

    if (!event.id || !event.type || !event.details || !event.time) {
        return res.status(400).send({ error: 'Недостатньо даних для збереження події' });
    }

    events.push(event);
    console.log('Подія отримана:', event);

    res.status(201).send({ message: 'Подію збережено', event });
});

app.get('/api/events', (req, res) => {
    res.status(200).send({ events });
    events = [];
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});
