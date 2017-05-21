// @flow

import { GraphQLObjectType } from 'graphql';
import addSpecialItemToUserShoppingList from './AddSpecialItemToUserShoppingList';
import removeSpecialItemFromUserShoppingList from './RemoveSpecialItemFromUserShoppingList';

export default new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addSpecialItemToUserShoppingList,
    removeSpecialItemFromUserShoppingList,
  },
});
