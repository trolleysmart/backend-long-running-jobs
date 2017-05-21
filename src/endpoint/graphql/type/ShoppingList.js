// @flow

import { List, Map } from 'immutable';
import { GraphQLID, GraphQLObjectType, GraphQLNonNull } from 'graphql';
import { connectionArgs, connectionFromArray } from 'graphql-relay';
import { MasterProductPriceService } from 'smart-grocery-parse-server-common';
import SpecialsConnection from './Specials';

export default new GraphQLObjectType({
  name: 'ShoppingList',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: _ => _.get('id'),
    },
    specials: {
      type: SpecialsConnection,
      args: {
        ...connectionArgs,
      },
      resolve: async (_, args) => {
        const masterProductPriceIds = _.get('masterProductPriceIds');

        if (masterProductPriceIds.isEmpty()) {
          return List();
        }

        const masterProductCriteria = Map({
          includeStore: true,
          includeMasterProduct: true,
          ids: masterProductPriceIds,
        });

        const result = MasterProductPriceService.searchAll(masterProductCriteria);

        try {
          let specials = List();

          result.event.subscribe(info => (specials = specials.push(info)));

          await result.promise;
          return connectionFromArray(specials.toArray(), args);
        } finally {
          result.event.unsubscribeAll();
        }
      },
    },
  },
});
