import {
  Map,
} from 'immutable';
import {
  GraphQLID,
  GraphQLFloat,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import {
  connectionArgs,
  connectionDefinitions,
  connectionFromPromisedArray,
  fromGlobalId,
  globalIdField,
  nodeDefinitions,
} from 'graphql-relay';
import {
  MasterProductPriceService,
} from 'smart-grocery-parse-server-common';

class Special {}
class User {}

const special = new Special();
const user = new User();

const {
  nodeInterface,
  nodeField,
} = nodeDefinitions(
  (globalId) => {
    const {
      type,
    } = fromGlobalId(globalId);
    if (type === 'Special') {
      return special;
    } else if (type === 'User') {
      return user;
    }
    return null;
  },
  (obj) => {
    if (obj instanceof Special) {
      return specialType;
    } else if (obj instanceof User) {
      return userType;
    }
    return null;
  },
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
    id: globalIdField('Special'),
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
    /* multiBuy: {
     *   type: multiBuyType,
     *   resolve: _ => _.getIn(['priceDetails', 'multiBuyInfo']),
     * },*/
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
    id: globalIdField('User'),
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
  },
  interfaces: [nodeInterface],
});

const rootQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    viewer: {
      type: userType,
      resolve: () => ({}),
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
