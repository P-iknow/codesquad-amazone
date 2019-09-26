const express = require('express');
const autoSuggestion = require('./autoSuggestion.js');

const PORT = process.env.PORT || 8080;
const app = express();

app.use('/auto-suggestion', autoSuggestion);
app.use(express.static('public'));
app.listen(PORT, _ => console.log(`start! express server on port ${PORT}`));
