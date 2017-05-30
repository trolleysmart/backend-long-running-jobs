// @flow

import Immutable, { Map, Set } from 'immutable';
import { GraphQLID, GraphQLObjectType, GraphQLString, GraphQLNonNull } from 'graphql';
import { connectionArgs, connectionFromArray } from 'graphql-relay';
import { MasterProductPriceService, ShoppingListService } from 'smart-grocery-parse-server-common';
import { NodeInterface } from '../interface';
import SpecialConnectionDefinition from './Specials';
import SpecialInShoppingListConnectionDefinition from './SpecialsInShoppingList';

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
        const descriptions = args.description
          ? Immutable.fromJS(args.description.replace(/\W/g, ' ').trim().toLowerCase().split(' '))
              .map(description => description.trim())
              .filter(description => description.length > 0)
              .toSet()
          : Set();

        if (descriptions.isEmpty() || descriptions.count() === 1) {
          const criteria = Map({
            includeStore: true,
            includeMasterProduct: true,
            orderByFieldAscending: 'masterProductDescription',
            conditions: Map({
              contains_masterProductDescription: descriptions.isEmpty() ? undefined : descriptions.first(),
              not_specialType: 'none',
            }),
          });

          const specials = await MasterProductPriceService.search(criteria.set('limit', args.first ? args.first : 1000));

          return connectionFromArray(specials.toArray(), args);
        }

        const allMatchedSpecials = await Promise.all(
          descriptions
            .map((description) => {
              const criteria = Map({
                includeStore: true,
                includeMasterProduct: true,
                orderByFieldAscending: 'masterProductDescription',
                conditions: Map({
                  contains_masterProductDescription: description,
                  not_specialType: 'none',
                }),
              });

              return MasterProductPriceService.search(criteria.set('limit', args.first ? args.first : 1000));
            })
            .toArray(),
        );

        /* TODO: 20170528 - Morteza: Should use Set.intersect instead of following implementation of it. Set.intersect currently is
         * undefined for unknown reason. */
        const flattenMatchedSpecials = Immutable.fromJS(allMatchedSpecials).flatMap(matchedSpecials => matchedSpecials);
        const groupedSpecialIds = flattenMatchedSpecials.groupBy(matchedSpecial => matchedSpecial.get('id')).filter(item => item.count() > 1);
        const specialsIntersect = flattenMatchedSpecials.filter(matchedSpecial => groupedSpecialIds.has(matchedSpecial.get('id')));

        return connectionFromArray(specialsIntersect.toArray(), args);
      },
    },
    specialsInShoppingList: {
      type: SpecialInShoppingListConnectionDefinition.connectionType,
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

        const specialsInfo = await ShoppingListService.search(criteria.set('limit', args.first ? args.first : 1000));
        const specialIds = specialsInfo.map(special => special.getIn(['masterProductPrice', 'id']));
        const groupedSpecialIds = specialIds.groupBy(specialId => specialId);

        if (specialIds.isEmpty()) {
          return connectionFromArray([], args);
        }

        const masterProductCriteria = Map({
          includeStore: true,
          includeMasterProduct: true,
          orderByFieldAscending: 'masterProductDescription',
          ids: specialIds.toSet(),
        });

        const specials = await MasterProductPriceService.search(masterProductCriteria);

        return connectionFromArray(specials.map(special => special.set('quantity', groupedSpecialIds.get(special.get('id')).size)).toArray(), args);
      },
    },
  },
  interfaces: [NodeInterface],
});
