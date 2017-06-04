// @flow

import { List, Map } from 'immutable';
import { GraphQLID, GraphQLString, GraphQLNonNull } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { Exception } from 'micro-business-parse-server-common';
import { MasterProductPriceService, ShoppingListService } from 'smart-grocery-parse-server-common';
import { ShoppingListConnectionDefinition } from '../type';

const getMasterProductPrice = async (id) => {
  const masterProductPriceCriteria = Map({
    includeStore: true,
    includeMasterProduct: true,
    id,
  });
  const masterProductPriceItems = await MasterProductPriceService.search(masterProductPriceCriteria);

  if (masterProductPriceItems.isEmpty()) {
    throw new Exception('Provided special item Id is invalid.');
  }

  return masterProductPriceItems.first();
};

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
  let shoppingListInfo = List();

  try {
    result.event.subscribe(info => (shoppingListInfo = shoppingListInfo.push(info)));

    await result.promise;
  } finally {
    result.event.unsubscribeAll();
  }

  return shoppingListInfo;
};

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
      const masterProductPrice = await getMasterProductPrice(specialItemId);
      await ShoppingListService.create(Map({ userId, masterProductPriceId: specialItemId, description: masterProductPrice.get('description') }));
      const shoppingListItems = await getAllShoppingListContainsSpecialItemId(userId, specialItemId);

      return {
        special: Map({
          shoppingListIds: shoppingListItems.map(item => item.get('id')),
          specialId: masterProductPrice.get('id'),
          description: masterProductPrice.getIn(['masterProduct', 'description']),
          imageUrl: masterProductPrice.getIn(['masterProduct', 'imageUrl']),
          barcode: masterProductPrice.getIn(['masterProduct', 'barcode']),
          specialType: masterProductPrice.getIn(['priceDetails', 'specialType']),
          price: masterProductPrice.getIn(['priceDetails', 'price']),
          wasPrice: masterProductPrice.getIn(['priceDetails', 'wasPrice']),
          multiBuyInfo: masterProductPrice.getIn(['priceDetails', 'multiBuyInfo']),
          storeName: masterProductPrice.getIn(['store', 'name']),
          storeImageUrl: masterProductPrice.getIn(['store', 'imageUrl']),
          quantity: shoppingListItems.count(),
        }),
      };
    } catch (ex) {
      return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
    }
  },
});
