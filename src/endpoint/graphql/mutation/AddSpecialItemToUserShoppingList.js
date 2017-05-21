// @flow

import { Map } from 'immutable';
import { GraphQLID, GraphQLString, GraphQLNonNull } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { Exception } from 'micro-business-parse-server-common';
import { ShoppingListService } from 'smart-grocery-parse-server-common';
import { ShoppingListType } from '../type';

export default mutationWithClientMutationId({
  name: 'AddSpecialItemToUserShoppingList',
  inputFields: {
    userId: { type: new GraphQLNonNull(GraphQLID) },
    specialItemId: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    errorMessage: {
      type: GraphQLString,
    },
    shoppingList: {
      type: ShoppingListType,
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
      const shoppingListInfo = await ShoppingListService.read(shoppingListId);
      const masterProductPriceIds = shoppingListInfo.get('masterProductPriceIds');

      if (masterProductPriceIds.find(_ => _.localeCompare(specialItemId) === 0)) {
        return { shoppingList: Map({ id: shoppingListInfo.get('id'), masterProductPriceIds: shoppingListInfo.get('masterProductPriceIds') }) };
      }

      const updatedShoppingListInfo = shoppingListInfo.update('masterProductPriceIds', _ => _.push(specialItemId));

      await ShoppingListService.update(updatedShoppingListInfo);

      return {
        shoppingList: Map({ id: updatedShoppingListInfo.get('id'), masterProductPriceIds: updatedShoppingListInfo.get('masterProductPriceIds') }),
      };
    } catch (ex) {
      return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
    }
  },
});
