// @flow

import { Map } from 'immutable';
import { GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';
import { StoreService } from 'smart-grocery-parse-server-common';

const storeType = new GraphQLObjectType({
  name: 'Store',
  fields: () => ({
    id: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
  }),
});

const storesField = {
  type: new GraphQLList(storeType),
  resolve: () =>
    new Promise((resolve, reject) => {
      StoreService.search(Map({})).then(info => resolve(info.toJS())).catch(error => reject(error));
    }),
};

export { storeType, storesField };
