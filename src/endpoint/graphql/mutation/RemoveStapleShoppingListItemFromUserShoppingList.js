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
  name: 'RemoveStapleShoppingListItemFromUserShoppingList',
  inputFields: {
    userId: { type: new GraphQLNonNull(GraphQLID) },
    stapleShoppingListItemId: { type: new GraphQLNonNull(GraphQLID) },
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
  mutateAndGetPayload: async ({ userId, stapleShoppingListItemId }) => {
    try {
      const shoppingListItems = await getAllShoppingListContainsStapleShoppingListItemId(userId, stapleShoppingListItemId);

      if (shoppingListItems.isEmpty()) {
        return {};
      }

      await ShoppingListService.update(shoppingListItems.first().set('doneDate', new Date()));

      if (shoppingListItems.count() === 1) {
        return {};
      }

      const stapleShoppingList = await getStapleShoppingList(userId, stapleShoppingListItemId);

      return {
        item: Map({
          shoppingListIds: shoppingListItems.skip(1).map(item => item.get('id')),
          stapleShoppingListId: stapleShoppingList.get('id'),
          description: stapleShoppingList.get('description'),
          quantity: shoppingListItems.count() - 1,
        }),
      };
    } catch (ex) {
      return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
    }
  },
});