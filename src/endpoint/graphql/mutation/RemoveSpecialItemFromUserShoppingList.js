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
  name: 'RemoveSpecialItemFromUserShoppingList',
  inputFields: {
    userId: { type: new GraphQLNonNull(GraphQLID) },
    specialItemId: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    errorMessage: {
      type: GraphQLString,
    },
    item: {
      type: ShoppingListConnectionDefinition.edgeType,
      resolve: _ => ({
        cursor: 'DummyCursor',
        node: _.item,
      }),
    },
  },
  mutateAndGetPayload: async ({ userId, specialItemId }) => {
    try {
      const shoppingListItems = await getAllShoppingListContainsSpecialItemId(userId, specialItemId);

      if (shoppingListItems.isEmpty()) {
        return {};
      }

      await ShoppingListService.update(shoppingListItems.first().set('doneDate', new Date()));

      if (shoppingListItems.count() === 1) {
        return {};
      }

      const masterProductPrice = await getMasterProductPrice(specialItemId);

      return {
        item: Map({
          shoppingListIds: shoppingListItems.skip(1).map(item => item.get('id')),
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
          quantity: shoppingListItems.count() - 1,
        }),
      };
    } catch (ex) {
      return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
    }
  },
});