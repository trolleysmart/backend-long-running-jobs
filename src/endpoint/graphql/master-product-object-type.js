import {
  Map,
} from 'immutable';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  MasterProductService,
} from 'smart-grocery-parse-server-common';

function getMasterProductObjectType() {
  return new GraphQLObjectType({
    name: 'MasterProduct',
    fields: () => ({
      id: {
        type: GraphQLString,
      },
      description: {
        type: GraphQLString,
      },
      barcode: {
        type: GraphQLString,
      },
      imageUrl: {
        type: GraphQLString,
      },
    }),
  });
}

function getMasterProductsObjectType() {
  return new GraphQLList(getMasterProductObjectType());
}

function getMasterProductsObjectField() {
  return {
    type: getMasterProductsObjectType(),
    resolve: () => new Promise((resolve, reject) => {
      MasterProductService.search(Map({}))
        .then(info => resolve(info.toJS()))
        .catch(error => reject(error));
    }),
  };
}

export {
  getMasterProductsObjectField,
};

export default getMasterProductsObjectField;
