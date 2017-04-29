import {
  Map,
} from 'immutable';
import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  MasterProductService,
  TagService,
} from 'smart-grocery-parse-server-common';

function getTagObjectType() {
  return new GraphQLObjectType({
    name: 'ProductTag',
    fields: () => ({
      id: {
        type: GraphQLString,
      },
      name: {
        type: GraphQLString,
      },
      weight: {
        type: GraphQLInt,
      },
    }),
  });
}

function getTagsObjectType() {
  return new GraphQLList(getTagObjectType());
}

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
      tags: {
        type: getTagsObjectType(),
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
      let masterProducts;

      MasterProductService.search(Map({}))
        .then((results) => {
          masterProducts = results;

          return TagService.search(Map({}));
        })
        .then((tags) => {
          resolve(masterProducts.map(masterProduct => masterProduct.update('tags', tagIds => tagIds.map(tagId => tags.find(tag => tag.get('id')
              .localeCompare(tagId) === 0)))
            .toJS()));
        })
        .catch(error => reject(error));
    }),
  };
}

export {
  getMasterProductsObjectField,
};

export default getMasterProductsObjectField;
