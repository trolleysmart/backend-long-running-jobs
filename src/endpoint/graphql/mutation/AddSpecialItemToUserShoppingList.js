// @flow

import { Map } from 'immutable';
import { GraphQLID, GraphQLString, GraphQLNonNull } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { Exception } from 'micro-business-parse-server-common';
import { MasterProductPriceService, ShoppingListService } from 'smart-grocery-parse-server-common';
import { SpecialConnectionDefinition } from '../type';

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
    special: {
      type: SpecialConnectionDefinition.edgeType,
      resolve: _ => ({
        cursor: 'DummyCursor',
        node: _.special,
      }),
    },
  },
  mutateAndGetPayload: async ({ userId, specialItemId }) => {
    try {
      const masterProductPriceCriteria = Map({
        includeStore: true,
        includeMasterProduct: true,
        id: specialItemId,
      });

      const masterProductPriceInfoSearchResults = await MasterProductPriceService.search(masterProductPriceCriteria);

      if (masterProductPriceInfoSearchResults.isEmpty()) {
        throw new Exception('Provided special item Id is invalid.');
      }

      const specialItem = masterProductPriceInfoSearchResults.first();
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
        return {
          special: specialItem,
        };
      }

      const updatedShoppingListInfo = shoppingListInfo.update('masterProductPriceIds', _ => _.push(specialItemId));

      await ShoppingListService.update(updatedShoppingListInfo);

      return {
        special: specialItem,
      };
    } catch (ex) {
      return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
    }
  },
});
