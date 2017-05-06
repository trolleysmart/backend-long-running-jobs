import {
  List,
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
            const criteria = Map({
              includeStore: true,
              includeMasterProduct: true,
              conditions: Map({
                contains_masterProductDescription: args.description ? args.description.trim() : undefined,
                not_specialType: 'none',
              }),
            });

            if (args.first) {
              MasterProductPriceService.search(criteria.set('limit', args.first))
                .then(specials => resolve(specials.toArray()))
                .catch(error => reject(error));
            } else {
              const result = MasterProductPriceService.searchAll(criteria);
              let specials = List();

              result.event.subscribe((info) => {
                specials = specials.push(info);
              });

              result.promise.then(() => {
                result.event.unsubscribeAll();
                resolve(specials.toArray());
              })
                .catch((error) => {
                  result.event.unsubscribeAll();
                  reject(error);
                });
            }
          });

          return connectionFromPromisedArray(promise, args);
        },
      },
    },
    interfaces: [nodeInterface],
  });

  return userType;
};
