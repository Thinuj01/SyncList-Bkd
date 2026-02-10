const itemService = require('../services/itemService');

class ItemController {
    async createItem(req, res) {
        try {
            const io = req.app.get('socketio');
            const result = await itemService.createItem(req.body, req.userId, io);
            res.status(201).json(result);
        } catch (error) {
            console.error(error);
            const statusCode = error.message.includes('required') ? 400 :
                             error.message.includes('Invalid List') ? 400 :
                             error.message.includes('not a member') ? 403 : 500;
            res.status(statusCode).json({ message: error.message });
        }
    }

    async getListItems(req, res) {
        try {
            const { id } = req.params;
            const list = await itemService.getListItems(id, req.userId);
            res.status(200).json(list);
        } catch (error) {
            console.error(error);
            const statusCode = error.message.includes('not found') ? 404 :
                             error.message.includes('not authorized') ? 403 : 500;
            res.status(statusCode).json({ message: error.message });
        }
    }

    async deleteItem(req, res) {
        try {
            const { id } = req.params;
            const io = req.app.get('socketio');
            const result = await itemService.deleteItem(id, req.userId, io);
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            const statusCode = error.message.includes('not found') ? 404 :
                             error.message.includes('not authorized') ? 403 : 500;
            res.status(statusCode).json({ message: error.message });
        }
    }

    async claimItem(req, res) {
        try {
            const { id } = req.params;
            const io = req.app.get('socketio');
            const result = await itemService.claimItem(id, req.userId, io);
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            const statusCode = error.message.includes('not found') ? 404 :
                             error.message.includes('not authorized') ? 403 :
                             error.message.includes('already claimed') ? 400 : 500;
            res.status(statusCode).json({ message: error.message });
        }
    }
}

module.exports = new ItemController();