const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req,res,next) =>{
    try{
        const authHeader = req.header('Authorization');

        if(!authHeader || !authHeader.startsWith('Bearer')){
            return res.status(401).json({message: 'Authoriztion denied. Invalid token.'});
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.userId = decoded.userId;

        next();

    }
    catch(error){
        res.status(401).json({message: 'Token is not valid, authorization denied.'})
    }
}

module.exports = authMiddleware;
