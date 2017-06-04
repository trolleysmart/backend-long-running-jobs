// @flow

import { GraphQLObjectType } from 'graphql';
import addSpecialItemToUserShoppingList from './AddSpecialItemToUserShoppingList';
import removeSpecialItemFromUserShoppingList from './RemoveSpecialItemFromUserShoppingList';
import removeSpecialItemsFromUserShoppingList from './RemoveSpecialItemsFromUserShoppingList';
import addStapleShoppingListItemToUserShoppingList from './AddStapleShoppingListItemToUserShoppingList';
import removeStapleShoppingListItemFromUserShoppingList from './RemoveStapleShoppingListItemFromUserShoppingList';
import removeStapleShoppingListItemsFromUserShoppingList from './RemoveStapleShoppingListItemsFromUserShoppingList';

export default new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addSpecialItemToUserShoppingList,
    removeSpecialItemFromUserShoppingList,
    removeSpecialItemsFromUserShoppingList,
    addStapleShoppingListItemToUserShoppingList,
    removeStapleShoppingListItemFromUserShoppingList,
    removeStapleShoppingListItemsFromUserShoppingList,
  },
});
