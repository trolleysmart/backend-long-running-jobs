// @flow

import { Map } from 'immutable';
import { GraphQLID, GraphQLString, GraphQLNonNull } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { Exception } from 'micro-business-parse-server-common';
import { MasterProductPriceService, ShoppingListService } from 'smart-grocery-parse-server-common';
import { ShoppingListConnectionDefinition } from '../type';

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
      type: ShoppingListConnectionDefinition.edgeType,
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

      const results = await MasterProductPriceService.search(masterProductPriceCriteria);

      if (results.isEmpty()) {
        throw new Exception('Provided special item Id is invalid.');
      }

      const result = results.first();

      const id = await ShoppingListService.create(Map({ userId, masterProductPriceId: specialItemId, description: result.get('description') }));

      return {
        special: Map({
          id,
          specialId: result.get('id'),
          description: result.getIn(['masterProduct', 'description']),
          imageUrl: result.getIn(['masterProduct', 'imageUrl']),
          barcode: result.getIn(['masterProduct', 'barcode']),
          specialType: result.getIn(['priceDetails', 'specialType']),
          price: result.getIn(['priceDetails', 'price']),
          wasPrice: result.getIn(['priceDetails', 'wasPrice']),
          multiBuyInfo: result.getIn(['priceDetails', 'multiBuyInfo']),
          storeName: result.getIn(['store', 'name']),
          storeImageUrl: result.getIn(['store', 'imageUrl']),
        }),
      };
    } catch (ex) {
      return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
    }
  },
});
