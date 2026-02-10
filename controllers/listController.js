const listService = require('../services/listService');

class ListController {
    async getLists(req, res) {
        try {
            const lists = await listService.getUserLists(req.userId);
            res.status(200).json({ lists });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error.' });
        }
    }

    async createList(req, res) {
        try {
            const listId = await listService.createList(req.body, req.userId);
            res.status(201).json(listId);
        } catch (error) {
            console.error(error);
            res.status(400).json({ message: error.message });
        }
    }

    async deleteList(req, res) {
        try {
            const { id } = req.params;
            const result = await listService.deleteList(id, req.userId);
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            const statusCode = error.message.includes('not Found') ? 404 : 
                             error.message.includes('not authorized') ? 403 : 500;
            res.status(statusCode).json({ message: error.message });
        }
    }

    async joinList(req, res) {
        try {
            const { id } = req.params;
            const result = await listService.joinList(id, req.userId);
            res.status(200).json(result);
        } catch (error) {
            console.error(error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({ message: error.message });
        }
    }
}

module.exports = new ListController();