// @flow

import hasha from 'hasha';
import Immutable, { List, Map, Set } from 'immutable';
import { GraphQLID, GraphQLObjectType, GraphQLString, GraphQLNonNull } from 'graphql';
import { connectionArgs, connectionFromArray } from 'graphql-relay';
import { Exception } from 'micro-business-parse-server-common';
import { MasterProductPriceService, ShoppingListService, StapleShoppingListService } from 'smart-grocery-parse-server-common';
import { NodeInterface } from '../interface';
import SpecialConnectionDefinition from './Specials';
import ShoppingListConnectionDefinition from './ShoppingList';
import StapleShoppingListConnectionDefinition from './StapleShoppingList';

const convertDescriptionArgumentToSet = (description) => {
  if (description) {
    return Immutable.fromJS(description.replace(/\W/g, ' ').trim().toLowerCase().split(' ')).map(_ => _.trim()).filter(_ => _.length > 0).toSet();
  }

  return Set();
};

const getMasterProductMatchCriteria = async (args, description) => {
  const criteria = Map({
    includeStore: true,
    includeMasterProduct: true,
    orderByFieldAscending: 'description',
    conditions: Map({
      contains_description: description,
      not_specialType: 'none',
    }),
  });

  return MasterProductPriceService.search(criteria.set('limit', args.first ? args.first : 10));
};

const getMasterProductPriceItems = async (args) => {
  const descriptions = convertDescriptionArgumentToSet(args.description);

  if (descriptions.isEmpty() || descriptions.count() === 1) {
    const masterPorductPriceItems = await getMasterProductMatchCriteria(args, descriptions.isEmpty() ? undefined : descriptions.first());

    return connectionFromArray(masterPorductPriceItems.toArray(), args);
  }

  const allMatchedMasterProductPriceItems = await Promise.all(
    descriptions.map(description => getMasterProductMatchCriteria(args, description)).toArray(),
  );

  /* TODO: 20170528 - Morteza: Should use Set.intersect instead of following implementation of it. Set.intersect currently is
   * undefined for unknown reason. */
  const flattenMasterProductPriceItems = Immutable.fromJS(allMatchedMasterProductPriceItems).flatMap(item => item);
  const groupedMasterProductPriceIds = flattenMasterProductPriceItems.groupBy(item => item.get('id')).filter(item => item.count() > 1);
  const masterProductPriceItemsIntersect = flattenMasterProductPriceItems
    .filter(item => groupedMasterProductPriceIds.has(item.get('id')))
    .groupBy(item => item.get('id'))
    .map(item => item.first());

  return connectionFromArray(masterProductPriceItemsIntersect.toArray(), args);
};

const getShoppingListMatchCriteria = async (userId, description) => {
  let shoppingListInfo = List();
  const criteria = Map({
    includeStapleShoppingList: true,
    includeMasterProductPrice: true,
    conditions: Map({
      userId,
      contains_description: description,
      excludeItemsMarkedAsDone: true,
      includeSpecialsOnly: true,
    }),
  });

  const result = await ShoppingListService.searchAll(criteria);

  try {
    result.event.subscribe(info => (shoppingListInfo = shoppingListInfo.push(info)));

    await result.promise;
  } finally {
    result.event.unsubscribeAll();
  }

  return shoppingListInfo;
};

const getStapleShoppingListInfo = async (userId, ids) => {
  if (ids.isEmpty()) {
    return List();
  }

  const criteria = Map({
    ids,
    conditions: Map({
      userId,
    }),
  });

  let stapleShoppingListInfo = List();
  const masterProductPriceSearchResult = await StapleShoppingListService.searchAll(criteria);

  try {
    masterProductPriceSearchResult.event.subscribe(info => (stapleShoppingListInfo = stapleShoppingListInfo.push(info)));

    await masterProductPriceSearchResult.promise;
  } finally {
    masterProductPriceSearchResult.event.unsubscribeAll();
  }

  return stapleShoppingListInfo;
};

const getMasterProductPriceInfo = async (ids) => {
  if (ids.isEmpty()) {
    return List();
  }

  const criteria = Map({
    includeStore: true,
    includeMasterProduct: true,
    ids,
  });

  let masterProductPriceInfo = List();
  const masterProductPriceSearchResult = await MasterProductPriceService.searchAll(criteria);

  try {
    masterProductPriceSearchResult.event.subscribe(info => (masterProductPriceInfo = masterProductPriceInfo.push(info)));

    await masterProductPriceSearchResult.promise;
  } finally {
    masterProductPriceSearchResult.event.unsubscribeAll();
  }

  return masterProductPriceInfo;
};

const getShoppingListItems = async (userId, args) => {
  const descriptions = convertDescriptionArgumentToSet(args.description);
  let shoppingListInfo = List();

  if (descriptions.isEmpty() || descriptions.count() === 1) {
    shoppingListInfo = await getShoppingListMatchCriteria(userId, descriptions.isEmpty() ? undefined : descriptions.first());
  } else {
    const allMatchedShoppingListInfo = await Promise.all(
      descriptions.map(description => getShoppingListMatchCriteria(userId, description)).toArray(),
    );

    /* TODO: 20170528 - Morteza: Should use Set.intersect instead of following implementation of it. Set.intersect currently is
     * undefined for unknown reason. */
    const flattenMatchedShoppingList = Immutable.fromJS(allMatchedShoppingListInfo).flatMap(item => item);
    const groupedShoppingList = flattenMatchedShoppingList.groupBy(item => item.get('id')).filter(item => item.count() > 1);

    shoppingListInfo = flattenMatchedShoppingList
      .filter(item => groupedShoppingList.has(item.get('id')))
      .groupBy(item => item.get('id'))
      .map(item => item.first());
  }

  const stapleShoppingListInInShoppingList = shoppingListInfo.filter(item => item.get('stapleShoppingList'));
  const masterProductPriceInShoppingList = shoppingListInfo.filter(item => item.get('masterProductPrice'));
  const stapleShoppingListIds = stapleShoppingListInInShoppingList.map(item => item.get('stapleShoppingListId'));
  const masterProductPriceIds = masterProductPriceInShoppingList.map(item => item.get('masterProductPriceId'));
  const results = await Promise.all([
    getStapleShoppingListInfo(userId, stapleShoppingListIds.toSet()),
    getMasterProductPriceInfo(masterProductPriceIds.toSet()),
  ]);
  const groupedStapleShoppingListIds = stapleShoppingListIds.groupBy(id => id);
  const groupedMasterProductPriceIds = masterProductPriceIds.groupBy(id => id);
  const completeListWithDuplication = shoppingListInfo.map((shoppingListItem) => {
    if (shoppingListItem.get('stapleShoppingList')) {
      const info = results[0];
      const foundItem = info.find(item => item.get('id').localeCompare(shoppingListItem.get('stapleShoppingListId')));

      if (foundItem) {
        return Map({
          id: shoppingListItem.get('id'),
          shoppingListIds: stapleShoppingListInInShoppingList
            .filter(item => item.get('stapleShoppingListId').localeCompare(foundItem.get('id')) === 0)
            .map(item => item.get('id')),
          stapleShoppingListId: foundItem.get('id'),
          description: foundItem.get('description'),
          quantity: groupedStapleShoppingListIds.get(foundItem.get('id')).size,
        });
      }

      throw new Exception(`Staple Shopping List not found: ${shoppingListItem.getIn(['stapleShoppingList', 'id'])}`);
    } else {
      const info = results[1];
      const foundItem = info.find(item => item.get('id').localeCompare(shoppingListItem.get('masterProductPriceId')) === 0);

      if (foundItem) {
        return Map({
          id: shoppingListItem.get('id'),
          specialId: foundItem.get('id'),
          description: foundItem.getIn(['masterProduct', 'description']),
          imageUrl: foundItem.getIn(['masterProduct', 'imageUrl']),
          barcode: foundItem.getIn(['masterProduct', 'barcode']),
          specialType: foundItem.getIn(['priceDetails', 'specialType']),
          price: foundItem.getIn(['priceDetails', 'price']),
          wasPrice: foundItem.getIn(['priceDetails', 'wasPrice']),
          multiBuyInfo: foundItem.getIn(['priceDetails', 'multiBuyInfo']),
          storeName: foundItem.getIn(['store', 'name']),
          storeImageUrl: foundItem.getIn(['store', 'imageUrl']),
          quantity: groupedMasterProductPriceIds.get(foundItem.get('id')).size,
        });
      }

      throw new Exception(`Master Product Price not found: ${shoppingListItem.getIn(['masterProductPrice', 'id'])}`);
    }
  });

  const completeStapleShoppingList = completeListWithDuplication
    .filter(item => item.get('stapleShoppingListId'))
    .groupBy(item => item.get('stapleShoppingListId'))
    .map((item) => {
      const ids = item.map(_ => _.get('id')).sort((item1, item2) => item1.localeCompare(item2));

      return item.first().set('id', hasha(ids.toArray().join(), { algorithm: 'md5' })).set('shoppingListIds', ids);
    });
  const completeMasterProductPrice = completeListWithDuplication
    .filter(item => item.get('specialId'))
    .groupBy(item => item.get('specialId'))
    .map((item) => {
      const ids = item.map(_ => _.get('id')).sort((item1, item2) => item1.localeCompare(item2));

      return item.first().set('id', hasha(ids.toArray().join(), { algorithm: 'md5' })).set('shoppingListIds', ids);
    });
  const completeList = completeStapleShoppingList
    .concat(completeMasterProductPrice)
    .sort((item1, item2) => item1.get('description').localeCompare(item2.get('description')))
    .take(args.first ? args.first : 10);

  return connectionFromArray(completeList.toArray(), args);
};

const getStapleShoppingListMatchCriteria = async (args, userId, description) => {
  const criteria = Map({
    includeTags: true,
    orderByFieldAscending: 'description',
    conditions: Map({
      userId,
      contains_description: description,
      not_specialType: 'none',
    }),
  });

  return StapleShoppingListService.search(criteria.set('limit', args.first ? args.first : 10));
};

const getStapleShoppingListItems = async (userId, args) => {
  const descriptions = convertDescriptionArgumentToSet(args.description);

  if (descriptions.isEmpty() || descriptions.count() === 1) {
    const stapleShoppingListItems = await getStapleShoppingListMatchCriteria(args, userId, descriptions.isEmpty() ? undefined : descriptions.first());

    return connectionFromArray(stapleShoppingListItems.toArray(), args);
  }

  const allMatchedStapleShoppingListItems = await Promise.all(
    descriptions.map(description => getStapleShoppingListMatchCriteria(args, userId, description)).toArray(),
  );

  /* TODO: 20170528 - Morteza: Should use Set.intersect instead of following implementation of it. Set.intersect currently is
   * undefined for unknown reason. */
  const flattenStapleShoppingListItems = Immutable.fromJS(allMatchedStapleShoppingListItems).flatMap(item => item);
  const groupedStapleShoppingListIds = flattenStapleShoppingListItems.groupBy(item => item.get('id')).filter(item => item.count() > 1);
  const stapleShoppingListIntersect = flattenStapleShoppingListItems
    .filter(item => groupedStapleShoppingListIds.has(item.get('id')))
    .groupBy(item => item.get('id'))
    .map(item => item.first());

  return connectionFromArray(stapleShoppingListIntersect.toArray(), args);
};

export default new GraphQLObjectType({
  name: 'User',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: _ => _.get('id'),
    },
    username: {
      type: GraphQLString,
      resolve: _ => _.get('username'),
    },
    specials: {
      type: SpecialConnectionDefinition.connectionType,
      args: {
        ...connectionArgs,
        description: {
          type: GraphQLString,
        },
      },
      resolve: async (_, args) => getMasterProductPriceItems(args),
    },
    shoppingList: {
      type: ShoppingListConnectionDefinition.connectionType,
      args: {
        ...connectionArgs,
        description: {
          type: GraphQLString,
        },
      },
      resolve: async (_, args) => getShoppingListItems(_.get('id'), args),
    },
    stapleShoppingList: {
      type: StapleShoppingListConnectionDefinition.connectionType,
      args: {
        ...connectionArgs,
        description: {
          type: GraphQLString,
        },
      },
      resolve: async (_, args) => getStapleShoppingListItems(_.get('id'), args),
    },
  },
  interfaces: [NodeInterface],
});
