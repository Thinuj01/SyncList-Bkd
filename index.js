const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // Loads the .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas! ✅');

        // Only start listening for requests AFTER the DB is connected
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

// Test route
app.get('/', (req, res) => {
    res.send('SyncList API is running!');
});