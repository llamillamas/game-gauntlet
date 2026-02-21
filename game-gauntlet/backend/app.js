const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const eventsRouter = require('./routes/events');
const betsRouter = require('./routes/bets');
const walletsRouter = require('./routes/wallets');

app.use('/api', eventsRouter);
app.use('/api', betsRouter);
app.use('/api', walletsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on :${PORT}`));

module.exports = app;
