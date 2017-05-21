// @flow

import { List, Map } from 'immutable';
import { GraphQLID, GraphQLObjectType, GraphQLString, GraphQLNonNull } from 'graphql';
import { connectionArgs, connectionFromArray } from 'graphql-relay';
import { MasterProductPriceService, ShoppingListService } from 'smart-grocery-parse-server-common';
import { NodeInterface } from '../interface';
import SpecialConnectionDefinition from './Specials';
import ShoppingListType from './ShoppingList';

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
    shoppingList: {
      type: ShoppingListType,
      resolve: async (_) => {
        const userId = _.get('id');
        const criteria = Map({
          includeMasterProductPrices: true,
          topMost: true,
          conditions: Map({
            userId,
          }),
        });

        const results = await ShoppingListService.search(criteria);

        if (results.isEmpty()) {
          const shoppingListId = await ShoppingListService.create(Map({ userId }));

          return Map({ id: shoppingListId, masterProductPriceIds: List() });
        }

        const shoppingList = results.first();

        return Map({ id: shoppingList.get('id'), masterProductPriceIds: shoppingList.get('masterProductPriceIds') });
      },
    },
  },
  interfaces: [NodeInterface],
});
