// @flow

import BluebirdPromise from 'bluebird';
import { List, Map, Range } from 'immutable';
import { GraphQLID, GraphQLString, GraphQLNonNull } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { Exception } from 'micro-business-parse-server-common';
import { ShoppingListService } from 'smart-grocery-parse-server-common';

const splitIntoChunks = (list, chunkSize) => Range(0, list.count(), chunkSize).map(chunkStart => list.slice(chunkStart, chunkStart + chunkSize));

const getAllShoppingListContainsStapleShoppingListItemId = async (userId, stapleShoppingListItemId) => {
  const criteria = Map({
    conditions: Map({
      userId,
      stapleShoppingListId: stapleShoppingListItemId,
      excludeItemsMarkedAsDone: true,
      includeStapleShoppingListOnly: true,
    }),
  });

  const result = await ShoppingListService.searchAll(criteria);
  let shoppingListItems = List();

  try {
    result.event.subscribe(info => (shoppingListItems = shoppingListItems.push(info)));

    await result.promise;
  } finally {
    result.event.unsubscribeAll();
  }

  return shoppingListItems;
};

export default mutationWithClientMutationId({
  name: 'RemoveStapleShoppingListItemsFromUserShoppingList',
  inputFields: {
    userId: { type: new GraphQLNonNull(GraphQLID) },
    stapleShoppingListItemId: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    errorMessage: {
      type: GraphQLString,
    },
  },
  mutateAndGetPayload: async ({ userId, stapleShoppingListItemId }) => {
    try {
      const shoppingListItems = await getAllShoppingListContainsStapleShoppingListItemId(userId, stapleShoppingListItemId);

      if (shoppingListItems.isEmpty()) {
        return {};
      }

      const splittedShoppingListItems = splitIntoChunks(shoppingListItems, 100);
      await BluebirdPromise.each(splittedShoppingListItems.toArray(), chunck =>
        Promise.all(chunck.map(item => ShoppingListService.update(item.set('doneDate', new Date())))),
      );

      return {};
    } catch (ex) {
      return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
    }
  },
});
