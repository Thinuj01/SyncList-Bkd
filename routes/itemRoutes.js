const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const List = require('../models/List');
const authMiddleware = require('../middleware/authMiddleware');

// POST- /api/item/
router.post('/', authMiddleware, async(req,res) => {
    try{
        const {itemName ,listId} = req.body;
        if(!itemName){
            return res.status(401).json({message: 'Item Name is required.'});
        }

        const list = await List.findById(listId)
        if(!list){
            return res.status(401).json({message: 'Invalid List.'});
        }

        const isMember = list.members.map(id => id.toString()).includes(req.userId);
        if(!isMember){
            return res.status(403).json({
                message: 'You are not a member on the list',
            });
        }

        const newItem = new Item({
            itemName,
            list: listId
        })

        const saveItem = await newItem.save();

        list.items.push(saveItem._id);
        await list.save();

        const io = req.app.get('socketio');
        io.to(saveItem.list.toString()).emit('itemAdded', saveItem);

        res.status(201).json({
            message: 'Item added to the List',
            id: saveItem._id
        });
    }
    catch(error){
        res.status(500).json({message: 'Internel Server Error.'});
    }
});

// GET- /api/item/:id
router.get('/:id',authMiddleware, async(req, res) => {
    try{
        const {id} = req.params;

        const list = await List.findById(id)
        .populate({
            path: 'items', 
            populate: {
                path: 'claimedBy', 
                select: 'username'
            }
        })
        .populate({
           path: 'members',
            select: 'username profilePictureUrl' 
        });
        
        const checkinglist = await List.findById(id);

        if(!list){
            res.status(404).json({message: 'List not found'});
        }

        const isMember = checkinglist.members.map(m => m.toString()).includes(req.userId);
        if(!isMember){
            return res.status(403).json({message: 'Your are not authorized to view this List'});
        }

        res.status(200).json(list);
    }
    catch(error){
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// DELETE- /api/item/:id
router.delete('/:id',authMiddleware, async(req,res) => {
    try{
        const{id} = req.params;

        const item = await Item.findById(id);
        if(!item){
            return res.status(404).json({message: 'Item not found'});
        }

        const list = await List.findById(item.list);
        if(!list){
            return res.status(404).json({message: 'List not found'});
        }

        const isMember = list.members.map(m => m.toString()).includes(req.userId);
        if(!isMember){
            return res.status(404).json({message: 'You are not authorised for this activity.'});
        }

        await List.findByIdAndUpdate(item.list,{
            $pull: {items: id}
        })

        await Item.findByIdAndDelete(id);

        const io = req.app.get('socketio');
        io.to(item.list.toString()).emit('itemDeleted', id);

        res.status(200).json({message: 'Item Deleted'});
    }
    catch(error){
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// PUT- api/item/claim/:id
router.put('/claim/:id', authMiddleware, async(req,res) => {
    try{
        const {id} = req.params;

        const item = await Item.findById(id);
        if(!item){
            return res.status(404).json({message: 'Item not found'});
        }

        const list = await List.findById(item.list);
        if(!item){
            return res.status(404).json({message: 'List not found'});
        }

        const isMember = list.members.map((m) => m.toString()).includes(req.userId);
        if (!isMember){
            return res.status(404).json({message: 'You are not authorized for this list'});
        }

        if(!item.isClaimed){
            item.isClaimed = true;
            item.claimedBy = req.userId;
        }else if(req.userId === item.claimedBy.toString()){
            item.isClaimed = false;
            item.claimedBy = null;
        }else{
            return res.status(404).json({message: 'Item already claimed'});
        }
        
        await item.save();

        const updatedItem = await Item.findById(item._id).populate({
            path: 'claimedBy',
            select: 'username'
        });

        const io = req.app.get('socketio');
        io.to(updatedItem.list.toString()).emit('itemUpdated', updatedItem);

        res.status(200).json({message: 'Item updated'});

    } 
    catch(error){
        res.status(500).json({message: error.message});
    }
});

module.exports= router;
