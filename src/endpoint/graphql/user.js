import {
  Map,
} from 'immutable';
import {
  GraphQLID,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';
import {
  connectionArgs,
  connectionDefinitions,
  connectionFromPromisedArray,
} from 'graphql-relay';
import {
  MasterProductPriceService,
} from 'smart-grocery-parse-server-common';
import getSpecialType from './specials';

export default (nodeInterface) => {
  const {
    connectionType: specialsConnection,
  } = connectionDefinitions({
    name: 'Special',
    nodeType: getSpecialType(nodeInterface),
  });

  const userType = new GraphQLObjectType({
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
    },
    interfaces: [nodeInterface],
  });

  return userType;
};
