const express = require('express');
const router = express.Router();

// Збереження події
router.post('/events', (req, res) => {
    const event = req.body;
    console.log('Подія отримана:', event);
    res.status(201).send({ message: 'Подію збережено' });
});

router.get('/events', (req, res) => {
    res.send({ events: [] });
});

module.exports = router;
