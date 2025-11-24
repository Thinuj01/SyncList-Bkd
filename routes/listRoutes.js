const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const List = require('../models/List');
const Item = require('../models/Item');

// GET- /api/list/
router.get('/', authMiddleware, async(req, res) => {
    try{
        const lists = await List.find({
            $or: [
                { owner: req.userId },
                { members: req.userId }
            ]
        });
        
        res.status(200).json({lists});
    }
    catch(error){
        console.error(error);
        res.status(500).json({message: 'Internal Server Error.'});
    }
});

// POST- /api/list/
router.post('/', authMiddleware, async(req,res) => {
    try{
        const {listName} = req.body;
        if(!listName){
            return res.status(400).json({message: 'List Name is required'});
        }

        const newList = new List({
            listName,
            owner: req.userId,
            members: [req.userId]
        });

        const saveList = await newList.save();

        res.status(201).json(saveList._id);
    }
    catch(error){
        res.status(500).json({message: 'Server Error.'});
    }
});

// DELETE- /api/list/:id
router.delete('/:id',authMiddleware, async(req,res) => {
    try{
        const {id} = req.params;

        const list = await List.findById(id);
        if(!list){
            return res.status(404).json({message: 'List not Found'});
        }

        if(list.owner.toString() != req.userId){
            return res.status(404).toString().json({message : 'Your are not authorised to delete the list'});
        }

        await Item.deleteMany({list: id});

        await List.findByIdAndDelete(id);

        res.status(200).json({message: 'List and all items of the list Deleted.'});
    }
    catch(error){
        res.status(500).json({message: error.message.toString()})
    }
});

// PUT- api/list/:id/join
router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const updatedList = await List.findByIdAndUpdate(
            id, 
            { $addToSet: { members: userId } },
            { new: true }
        );

        if (!updatedList) {
            return res.status(404).json({ message: 'List not found' });
        }

        res.status(200).json({ message: 'Member joined successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
