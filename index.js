const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); 
const cors = require('cors');

const http = require('http');
const {Server} = require('socket.io');

const authRoutes= require('./routes/authRoutes');
const listRoutes= require('./routes/listRoutes');
const itemRoutes= require('./routes/itemRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('socketio',io);

io.on('connection', (socket) => {
    console.log('user connected', socket.id);

    socket.on('joinList', (listId) => {
        socket.join(listId);
        console.log(`User ${socket.id} joined list ${listId}`);
    });

    socket.on('leaveList', (listId) => {
        socket.leave(listId);
        console.log(`User ${socket.id} left list ${listId}`);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');

        server.listen(process.env.PORT || 3000, () => {
            console.log(`Server (with Sockets) is running on http://localhost:${process.env.PORT || 3000}`);
        });
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

// Test route
app.get('/', (req, res) => {
    res.send('SyncList API is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/list', listRoutes);
app.use('/api/item', itemRoutes);