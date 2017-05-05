import {
  Map,
} from 'immutable';
import {
  GraphQLID,
  GraphQLFloat,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';
import {
  connectionArgs,
  connectionDefinitions,
  connectionFromPromisedArray,
  nodeDefinitions,
} from 'graphql-relay';
import {
  MasterProductPriceService,
} from 'smart-grocery-parse-server-common';
import {
  UserService,
} from 'micro-business-parse-server-common';

const {
  nodeInterface,
  nodeField,
} = nodeDefinitions(
  () => null,
  () => null,
);

const multiBuyType = new GraphQLObjectType({
  name: 'MultiBuy',
  fields: () => ({
    count: {
      type: GraphQLInt,
      resolve: _ => _.get('count'),
    },
    price: {
      type: GraphQLFloat,
      resolve: _ => _.get('price'),
    },
  }),
});

const specialType = new GraphQLObjectType({
  name: 'Special',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: _ => _.get('id'),
    },
    description: {
      type: GraphQLString,
      resolve: _ => _.getIn(['masterProduct', 'description']),
    },
    storeName: {
      type: GraphQLString,
      resolve: _ => _.getIn(['store', 'name']),
    },
    specialType: {
      type: GraphQLString,
      resolve: _ => _.getIn(['priceDetails', 'specialType']),
    },
    price: {
      type: GraphQLFloat,
      resolve: _ => _.getIn(['priceDetails', 'price']),
    },
    wasPrice: {
      type: GraphQLFloat,
      resolve: _ => _.getIn(['priceDetails', 'wasPrice']),
    },
    multiBuy: {
      type: multiBuyType,
      resolve: _ => _.getIn(['priceDetails', 'multiBuyInfo']),
    },
  },
  interfaces: [nodeInterface],
});

const {
  connectionType: specialsConnection,
} = connectionDefinitions({
  name: 'Special',
  nodeType: specialType,
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

const rootQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    user: {
      type: userType,
      args: {
        username: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: (_, args) => new Promise((resolve, reject) => {
        UserService.getUserInfo(args.username)
          .then(info => resolve(info))
          .catch(error => reject(error));
      }),
    },
    node: nodeField,
  },
});

export {
  rootQueryType,
};

export default {
  rootQueryType,
};
