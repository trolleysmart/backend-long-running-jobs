// @flow

import { List, Map, Set } from 'immutable';
import { GraphQLID, GraphQLObjectType, GraphQLString, GraphQLNonNull } from 'graphql';
import { connectionArgs, connectionFromArray } from 'graphql-relay';
import { MasterProductPriceService, ShoppingListService } from 'smart-grocery-parse-server-common';
import { NodeInterface } from '../interface';
import SpecialConnectionDefinition from './Specials';

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
      resolve: async (_, args) => {
        const criteria = Map({
          includeStore: true,
          includeMasterProduct: true,
          orderByFieldAscending: 'masterProductDescription',
          conditions: Map({
            contains_masterProductDescription: args.description ? args.description.trim() : undefined,
            not_specialType: 'none',
          }),
        });

        let specials;

        if (args.first) {
          specials = await MasterProductPriceService.search(criteria.set('limit', args.first));
        } else {
          const result = MasterProductPriceService.searchAll(criteria);

          try {
            specials = List();

            result.event.subscribe((info) => {
              specials = specials.push(info);
            });

            await result.promise;
          } finally {
            result.event.unsubscribeAll();
          }
        }

        return connectionFromArray(specials.toArray(), args);
      },
    },
    specialsInShoppingList: {
      type: SpecialConnectionDefinition.connectionType,
      args: {
        ...connectionArgs,
      },
      resolve: async (_, args) => {
        const userId = _.get('id');
        const criteria = Map({
          includeMasterProductPrice: true,
          conditions: Map({
            userId,
            excludeItemsMarkedAsDone: true,
            includeSpecialsOnly: true,
          }),
        });

        const shoppingListSearchResult = await ShoppingListService.searchAll(criteria);
        let specialIds = Set();

        try {
          shoppingListSearchResult.event.subscribe(info => (specialIds = specialIds.add(info.getIn(['masterProductPrice', 'id']))));

          await shoppingListSearchResult.promise;
        } finally {
          shoppingListSearchResult.event.unsubscribeAll();
        }

        if (specialIds.isEmpty()) {
          return connectionFromArray([], args);
        }

        const masterProductCriteria = Map({
          includeStore: true,
          includeMasterProduct: true,
          orderByFieldAscending: 'masterProductDescription',
          ids: specialIds,
        });

        const masterProductPriceSearchResult = MasterProductPriceService.searchAll(masterProductCriteria);

        try {
          let specials = List();

          masterProductPriceSearchResult.event.subscribe(info => (specials = specials.push(info)));

          await masterProductPriceSearchResult.promise;
          return connectionFromArray(specials.toArray(), args);
        } finally {
          masterProductPriceSearchResult.event.unsubscribeAll();
        }
      },
    },
  },
  interfaces: [NodeInterface],
});
