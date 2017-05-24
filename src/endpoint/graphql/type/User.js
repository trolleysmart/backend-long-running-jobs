// @flow

import { Map } from 'immutable';
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

        const specials = await MasterProductPriceService.search(criteria.set('limit', args.first ? args.first : 1000));

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

        const specialsInfo = await ShoppingListService.search(criteria.set('limit', args.first ? args.first : 1000));
        const specialIds = specialsInfo.map(special => special.getIn(['masterProductPrice', 'id'])).toSet();

        if (specialIds.isEmpty()) {
          return connectionFromArray([], args);
        }

        const masterProductCriteria = Map({
          includeStore: true,
          includeMasterProduct: true,
          orderByFieldAscending: 'masterProductDescription',
          ids: specialIds,
        });

        const specials = await MasterProductPriceService.search(masterProductCriteria);

        return connectionFromArray(specials.toArray(), args);
      },
    },
  },
  interfaces: [NodeInterface],
});
