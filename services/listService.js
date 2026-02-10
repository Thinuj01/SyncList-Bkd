const List = require('../models/List');
const Item = require('../models/Item');

class ListService {
    async getUserLists(userId) {
        const lists = await List.find({
            $or: [
                { owner: userId },
                { members: userId }
            ]
        });
        return lists;
    }

    async createList(listData, userId) {
        const { listName } = listData;
        
        if (!listName) {
            throw new Error('List Name is required');
        }

        const newList = new List({
            listName,
            owner: userId,
            members: [userId]
        });

        const savedList = await newList.save();
        return savedList._id;
    }

    async deleteList(listId, userId) {
        const list = await List.findById(listId);
        if (!list) {
            throw new Error('List not Found');
        }

        if (list.owner.toString() !== userId) {
            throw new Error('You are not authorized to delete the list');
        }

        // Delete all items in the list
        await Item.deleteMany({ list: listId });
        
        // Delete the list
        await List.findByIdAndDelete(listId);
        
        return { message: 'List and all items of the list deleted.' };
    }

    async joinList(listId, userId) {
        const updatedList = await List.findByIdAndUpdate(
            listId,
            { $addToSet: { members: userId } },
            { new: true }
        );

        if (!updatedList) {
            throw new Error('List not found');
        }

        return { message: 'Member joined successfully' };
    }

    async checkMembership(listId, userId) {
        const list = await List.findById(listId);
        if (!list) {
            throw new Error('List not found');
        }

        const isMember = list.members.map(m => m.toString()).includes(userId);
        return { isMember, list };
    }
}

module.exports = new ListService();