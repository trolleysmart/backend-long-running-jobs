import {
  Map,
} from 'immutable';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  StoreService,
} from 'smart-grocery-parse-server-common';

function getStoreObjectType() {
  return new GraphQLObjectType({
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
}

function getStoresObjectType() {
  return new GraphQLList(getStoreObjectType());
}

function getStoresObjectField() {
  return {
    type: getStoresObjectType(),
    resolve: () => new Promise((resolve, reject) => {
      StoreService.search(Map({}))
        .then(info => resolve(info.toJS()))
        .catch(error => reject(error));
    }),
  };
}

export {
  getStoresObjectField,
};

export default getStoresObjectField;
