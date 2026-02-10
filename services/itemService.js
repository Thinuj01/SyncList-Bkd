const Item = require('../models/Item');
const List = require('../models/List');

class ItemService {
    async createItem(itemData, userId, io) {
        const { itemName, listId } = itemData;
        
        if (!itemName) {
            throw new Error('Item Name is required.');
        }

        const list = await List.findById(listId);
        if (!list) {
            throw new Error('Invalid List.');
        }

        const isMember = list.members.map(id => id.toString()).includes(userId);
        if (!isMember) {
            throw new Error('You are not a member of the list');
        }

        const newItem = new Item({
            itemName,
            list: listId
        });

        const savedItem = await newItem.save();

        // Add item to list
        list.items.push(savedItem._id);
        await list.save();

        // Emit socket event
        if (io) {
            io.to(savedItem.list.toString()).emit('itemAdded', savedItem);
        }

        return { message: 'Item added to the List', id: savedItem._id };
    }

    async getListItems(listId, userId) {
        const list = await List.findById(listId)
            .populate({
                path: 'items',
                populate: {
                    path: 'claimedBy',
                    select: 'username profilePictureUrl'
                }
            })
            .populate({
                path: 'members',
                select: 'username profilePictureUrl'
            });

        if (!list) {
            throw new Error('List not found');
        }

        const checkingList = await List.findById(listId);
        const isMember = checkingList.members.map(m => m.toString()).includes(userId);
        
        if (!isMember) {
            throw new Error('You are not authorized to view this List');
        }

        return list;
    }

    async deleteItem(itemId, userId, io) {
        const item = await Item.findById(itemId);
        if (!item) {
            throw new Error('Item not found');
        }

        const list = await List.findById(item.list);
        if (!list) {
            throw new Error('List not found');
        }

        const isMember = list.members.map(m => m.toString()).includes(userId);
        if (!isMember) {
            throw new Error('You are not authorized for this activity.');
        }

        // Remove item from list
        await List.findByIdAndUpdate(item.list, {
            $pull: { items: itemId }
        });

        // Delete the item
        await Item.findByIdAndDelete(itemId);

        // Emit socket event
        if (io) {
            io.to(item.list.toString()).emit('itemDeleted', itemId);
        }

        return { message: 'Item Deleted' };
    }

    async claimItem(itemId, userId, io) {
        const item = await Item.findById(itemId);
        if (!item) {
            throw new Error('Item not found');
        }

        const list = await List.findById(item.list);
        if (!list) {
            throw new Error('List not found');
        }

        const isMember = list.members.map((m) => m.toString()).includes(userId);
        if (!isMember) {
            throw new Error('You are not authorized for this list');
        }

        if (!item.isClaimed) {
            item.isClaimed = true;
            item.claimedBy = userId;
        } else if (userId === item.claimedBy.toString()) {
            item.isClaimed = false;
            item.claimedBy = null;
        } else {
            throw new Error('Item already claimed');
        }

        await item.save();

        const updatedItem = await Item.findById(item._id).populate({
            path: 'claimedBy',
            select: 'username profilePictureUrl'
        });

        // Emit socket event
        if (io) {
            io.to(updatedItem.list.toString()).emit('itemUpdated', updatedItem);
        }

        return { message: 'Item updated' };
    }
}

module.exports = new ItemService();