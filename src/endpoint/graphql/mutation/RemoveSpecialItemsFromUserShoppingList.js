// @flow

import BluebirdPromise from 'bluebird';
import { List, Map, Range } from 'immutable';
import { GraphQLID, GraphQLString, GraphQLNonNull } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { Exception } from 'micro-business-parse-server-common';
import { ShoppingListService } from 'smart-grocery-parse-server-common';

const splitIntoChunks = (list, chunkSize) => Range(0, list.count(), chunkSize).map(chunkStart => list.slice(chunkStart, chunkStart + chunkSize));

const getAllShoppingListContainsSpecialItemId = async (userId, specialItemId) => {
  const criteria = Map({
    conditions: Map({
      userId,
      masterProductPriceId: specialItemId,
      excludeItemsMarkedAsDone: true,
      includeMasterProductPriceOnly: true,
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
  name: 'RemoveSpecialItemsFromUserShoppingList',
  inputFields: {
    userId: { type: new GraphQLNonNull(GraphQLID) },
    specialItemId: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    errorMessage: {
      type: GraphQLString,
    },
  },
  mutateAndGetPayload: async ({ userId, specialItemId }) => {
    try {
      const shoppingListItems = await getAllShoppingListContainsSpecialItemId(userId, specialItemId);

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
