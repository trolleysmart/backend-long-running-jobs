// @flow

import { List, Map } from 'immutable';
import { GraphQLID, GraphQLString, GraphQLNonNull } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { Exception } from 'micro-business-parse-server-common';
import { ShoppingListService } from 'smart-grocery-parse-server-common';

export default mutationWithClientMutationId({
  name: 'RemoveSpecialItemFromUserShoppingList',
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

      if (shoppingListItems.isEmpty()) {
        return {};
      }

      await Promise.all(
        shoppingListItems.map(shoppingListItem => ShoppingListService.update(shoppingListItem.set('doneDate', new Date()))).toArray(),
      );

      return {};
    } catch (ex) {
      return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
    }
  },
});
