// @flow

import BluebirdPromise from 'bluebird';
import Immutable, { List, Map, Range } from 'immutable';
import { Exception } from 'micro-business-parse-server-common';
import { StapleShoppingListService, StapleTemplateShoppingListService, ShoppingListService } from 'smart-grocery-parse-server-common';

const splitIntoChunks = (list, chunkSize) => Range(0, list.count(), chunkSize).map(chunkStart => list.slice(chunkStart, chunkStart + chunkSize));

const removeDescriptionInvalidCharacters = (description) => {
  if (description) {
    return Immutable.fromJS(description.replace(/\W/g, ' ').trim().split(' '))
      .map(_ => _.trim())
      .filter(_ => _.length > 0)
      .reduce((reduction, value) => `${reduction} ${value}`);
  }

  return '';
};

const getStapleShoppingListItems = async (userId, description) => {
  const criteria = Map({
    conditions: Map({
      userId,
      description: description.toLowerCase(),
    }),
  });

  return StapleShoppingListService.search(criteria);
};

const getStapleTemplateShoppingListItems = async (description) => {
  const criteria = Map({
    conditions: Map({
      description: description.toLowerCase(),
    }),
  });

  return StapleTemplateShoppingListService.search(criteria);
};

const getStapleShoppingListById = async (userId, id) => {
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

export const addStapleShoppingListItemToUserShoppingList = async (userId, stapleShoppingListItemId) => {
  try {
    const stapleShoppingList = await getStapleShoppingListById(userId, stapleShoppingListItemId);
    await ShoppingListService.create(
      Map({ userId, stapleShoppingListId: stapleShoppingListItemId, description: stapleShoppingList.get('description') }),
    );
    const shoppingListItems = await getAllShoppingListContainsStapleShoppingListItemId(userId, stapleShoppingListItemId);

    return {
      item: Map({
        shoppingListIds: shoppingListItems.map(item => item.get('id')),
        stapleShoppingListId: stapleShoppingList.get('id'),
        description: stapleShoppingList.get('description'),
        quantity: shoppingListItems.count(),
      }),
    };
  } catch (ex) {
    return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
  }
};

export const addNewStapleShoppingListToShoppingList = async (userId, description) => {
  try {
    const trimmedDescription = removeDescriptionInvalidCharacters(description);

    if (trimmedDescription.length === 0) {
      throw new Exception('Description is invalid.');
    }

    const stapleShoppingListItems = await getStapleShoppingListItems(userId, trimmedDescription);
    let stapleShoppingListItemId;

    if (stapleShoppingListItems.isEmpty()) {
      const stapleTemplateShoppingListItems = await getStapleTemplateShoppingListItems(trimmedDescription);

      if (stapleTemplateShoppingListItems.isEmpty()) {
        stapleShoppingListItemId = await StapleShoppingListService.create(Map({ userId, description }));
      } else {
        stapleShoppingListItemId = await StapleShoppingListService.create(stapleTemplateShoppingListItems.first().set('userId', userId));
      }
    } else {
      stapleShoppingListItemId = stapleShoppingListItems.first().get('id');
    }

    return await addStapleShoppingListItemToUserShoppingList(userId, stapleShoppingListItemId);
  } catch (ex) {
    return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
  }
};

export const removeStapleShoppingListItemFromUserShoppingList = async (userId, stapleShoppingListItemId) => {
  try {
    const shoppingListItems = await getAllShoppingListContainsStapleShoppingListItemId(userId, stapleShoppingListItemId);

    if (shoppingListItems.isEmpty()) {
      return {};
    }

    await ShoppingListService.update(shoppingListItems.first().set('doneDate', new Date()));

    if (shoppingListItems.count() === 1) {
      return {};
    }

    const stapleShoppingList = await getStapleShoppingListById(userId, stapleShoppingListItemId);

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
};

export const removeStapleShoppingListItemsFromUserShoppingList = async (userId, stapleShoppingListItemId) => {
  try {
    const shoppingListItems = await getAllShoppingListContainsStapleShoppingListItemId(userId, stapleShoppingListItemId);

    if (shoppingListItems.isEmpty()) {
      return {};
    }

    const splittedShoppingListItems = splitIntoChunks(shoppingListItems, 100);
    await BluebirdPromise.each(splittedShoppingListItems.toArray(), chunck =>
      Promise.all(chunck.map(item => ShoppingListService.update(item.set('doneDate', new Date())))),
    );

    return {};
  } catch (ex) {
    return { errorMessage: ex instanceof Exception ? ex.getErrorMessage() : ex };
  }
};
