// @flow

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

const getMasterProductMatchCriteria = async (args, descriptions) => {
  const criteria = Map({
    includeStore: true,
    includeMasterProduct: true,
    orderByFieldAscending: 'description',
    conditions: Map({
      contains_descriptions: descriptions,
      not_specialType: 'none',
    }),
  });

  return MasterProductPriceService.search(criteria.set('limit', args.first ? args.first : 10));
};

const getMasterProductPriceItems = async (args) => {
  const descriptions = convertDescriptionArgumentToSet(args.description);
  const masterPorductPriceItems = await getMasterProductMatchCriteria(args, descriptions);

  return connectionFromArray(masterPorductPriceItems.toArray(), args);
};

const getShoppingListMatchCriteria = async (userId, descriptions) => {
  let shoppingListItems = List();
  const criteria = Map({
    includeStapleShoppingList: true,
    includeMasterProductPrice: true,
    conditions: Map({
      userId,
      contains_descriptions: descriptions,
      excludeItemsMarkedAsDone: true,
      includeSpecialsOnly: true,
    }),
  });

  const result = await ShoppingListService.searchAll(criteria);

  try {
    result.event.subscribe(info => (shoppingListItems = shoppingListItems.push(info)));

    await result.promise;
  } finally {
    result.event.unsubscribeAll();
  }

  return shoppingListItems;
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
  const shoppingListItems = await getShoppingListMatchCriteria(userId, descriptions);

  const stapleShoppingListInInShoppingList = shoppingListItems.filter(item => item.get('stapleShoppingList'));
  const masterProductPriceInShoppingList = shoppingListItems.filter(item => item.get('masterProductPrice'));
  const stapleShoppingListIds = stapleShoppingListInInShoppingList.map(item => item.get('stapleShoppingListId'));
  const masterProductPriceIds = masterProductPriceInShoppingList.map(item => item.get('masterProductPriceId'));
  const results = await Promise.all([
    getStapleShoppingListInfo(userId, stapleShoppingListIds.toSet()),
    getMasterProductPriceInfo(masterProductPriceIds.toSet()),
  ]);
  const groupedStapleShoppingListIds = stapleShoppingListIds.groupBy(id => id);
  const groupedMasterProductPriceIds = masterProductPriceIds.groupBy(id => id);
  const completeListWithDuplication = shoppingListItems.map((shoppingListItem) => {
    if (shoppingListItem.get('stapleShoppingList')) {
      const info = results[0];
      const foundItem = info.find(item => item.get('id').localeCompare(shoppingListItem.get('stapleShoppingListId')) === 0);

      if (foundItem) {
        return Map({
          id: shoppingListItem.get('id'),
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
          comments: '',
          unitSize: '',
          expiryDate: new Date().toISOString(),
          quantity: groupedMasterProductPriceIds.get(foundItem.get('id')).size,
        });
      }

      throw new Exception(`Master Product Price not found: ${shoppingListItem.getIn(['masterProductPrice', 'id'])}`);
    }
  });

  const completeStapleShoppingList = completeListWithDuplication
    .filter(item => item.get('stapleShoppingListId'))
    .groupBy(item => item.get('stapleShoppingListId'))
    .map(item => item.first().set('shoppingListIds', item.map(_ => _.get('id'))));
  const completeMasterProductPrice = completeListWithDuplication
    .filter(item => item.get('specialId'))
    .groupBy(item => item.get('specialId'))
    .map(item => item.first().set('shoppingListIds', item.map(_ => _.get('id'))));
  const completeList = completeStapleShoppingList
    .concat(completeMasterProductPrice)
    .sort((item1, item2) => item1.get('description').localeCompare(item2.get('description')))
    .take(args.first ? args.first : 10);

  return connectionFromArray(completeList.toArray(), args);
};

const getStapleShoppingListMatchCriteria = async (args, userId, descriptions) => {
  const criteria = Map({
    includeTags: true,
    orderByFieldAscending: 'description',
    conditions: Map({
      userId,
      contains_descriptions: descriptions,
      not_specialType: 'none',
    }),
  });

  return StapleShoppingListService.search(criteria.set('limit', args.first ? args.first : 10));
};

const getStapleShoppingListItems = async (userId, args) => {
  const descriptions = convertDescriptionArgumentToSet(args.description);
  const stapleShoppingListItems = await getStapleShoppingListMatchCriteria(args, userId, descriptions);

  return connectionFromArray(stapleShoppingListItems.toArray(), args);
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
