// @flow

import { GraphQLObjectType } from 'graphql';
import addSpecialItemToUserShoppingList from './AddSpecialItemToUserShoppingList';

export default new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addSpecialItemToUserShoppingList,
  },
});
