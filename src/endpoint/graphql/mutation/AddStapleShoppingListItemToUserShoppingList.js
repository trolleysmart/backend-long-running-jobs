// @flow

import { List, Map } from 'immutable';
import { GraphQLID, GraphQLString, GraphQLNonNull } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { Exception } from 'micro-business-parse-server-common';
import { StapleShoppingListService, ShoppingListService } from 'smart-grocery-parse-server-common';
import { ShoppingListConnectionDefinition } from '../type';

const getStapleShoppingList = async (userId, id) => {
  const stapleShoppingListCriteria = Map({
    id,
    conditions: Map({
      userId,
    }),
  });
  const stapleShoppingListItems = await StapleShoppingListService.search(stapleShoppingListCriteria);

  if (stapleShoppingListItems.isEmpty()) {
    throw new Exception('Provided staple shopping list item Id is invalid.');
  }

  return stapleShoppingListItems.first();
};

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
  name: 'AddStapleShoppingListItemToUserShoppingList',
  inputFields: {
    userId: { type: new GraphQLNonNull(GraphQLID) },
    stapleShoppingListItemId: { type: new GraphQLNonNull(GraphQLID) },
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
  mutateAndGetPayload: async ({ userId, stapleShoppingListItemId }) => {
    try {
      const stapleShoppingList = await getStapleShoppingList(userId, stapleShoppingListItemId);
      await ShoppingListService.create(
        Map({ userId, stapleShoppingListId: stapleShoppingListItemId, description: stapleShoppingList.get('description') }),
      );
      const shoppingListItems = await getAllShoppingListContainsStapleShoppingListItemId(userId, stapleShoppingListItemId);

      return {
        special: Map({
          shoppingListIds: shoppingListItems.map(item => item.get('id')),
          stapleShoppingListId: stapleShoppingList.get('id'),
          description: stapleShoppingList.get('description'),
          quantity: shoppingListItems.count(),
        }),
      };
    } catch (ex) {
      return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
    }
  },
});
