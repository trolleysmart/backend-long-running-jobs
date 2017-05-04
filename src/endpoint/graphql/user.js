import {
  Map,
} from 'immutable';
import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  connectionArgs,
  connectionFromPromisedArray,
} from 'graphql-relay';
import {
  UserService,
} from 'micro-business-parse-server-common';
import {
  MasterProductPriceService,
} from 'smart-grocery-parse-server-common';
import {
  specialsConnection,
} from './specials';

const userType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: {
      type: GraphQLString,
    },
    username: {
      type: GraphQLString,
    },
    specials: {
      type: specialsConnection,
      args: {
        ...connectionArgs,
        description: {
          type: GraphQLString,
        },
      },
      resolve: (_, args) => {
        const promise = new Promise((resolve, reject) => {
          MasterProductPriceService.search(Map({
            limit: args.first,
            includeStore: true,
            includeMasterProduct: true,
            conditions: Map({
              contains_masterProductDescription: args.description ? args.description.trim() : undefined,
              not_specialType: 'none',
            }),
          }))
            .then(specials => resolve(specials.toArray()))
            .catch(error => reject(error));
        });

        return connectionFromPromisedArray(promise, args);
      },
    },
  }),
});

const userField = {
  type: userType,
  args: {
    username: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_, args) => new Promise((resolve, reject) => {
    UserService.getUserInfo(args.username)
      .then(info => resolve(info.toJS()))
      .catch(error => reject(error));
  }),
};

export {
  userType,
  userField,
};
