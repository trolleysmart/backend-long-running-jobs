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
        includeMasterProductPrices: true,
        topMost: true,
        conditions: Map({
          userId,
        }),
      });

      const results = await ShoppingListService.search(criteria);
      const shoppingListId = results.isEmpty() ? await ShoppingListService.create(Map({ userId })) : results.first().get('id');

      if (results.isEmpty()) {
        return { shoppingList: Map({ id: shoppingListId, masterProductPriceIds: List() }) };
      }

      const shoppingListInfo = await ShoppingListService.read(shoppingListId);
      const masterProductPriceIds = shoppingListInfo.get('masterProductPriceIds');

      if (!masterProductPriceIds.find(_ => _.localeCompare(specialItemId) === 0)) {
        return {};
      }

      const updatedShoppingListInfo = shoppingListInfo.update('masterProductPriceIds', _ => _.filterNot(id => id.localeCompare(specialItemId) === 0));

      await ShoppingListService.update(updatedShoppingListInfo);

      return {};
    } catch (ex) {
      return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
    }
  },
});
