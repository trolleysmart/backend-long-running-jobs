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
        id: specialItemId,
      });

      const masterProductPriceInfoSearchResults = await MasterProductPriceService.search(masterProductPriceCriteria);

      if (masterProductPriceInfoSearchResults.isEmpty()) {
        throw new Exception('Provided special item Id is invalid.');
      }

      await ShoppingListService.create(
        Map({ userId, masterProductPriceId: specialItemId, description: masterProductPriceInfoSearchResults.first().get('description') }),
      );

      return {
        special: masterProductPriceInfoSearchResults.first(),
      };
    } catch (ex) {
      return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
    }
  },
});
