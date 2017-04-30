import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import graphqlFields from 'graphql-fields';
import {
  List,
  Map,
} from 'immutable';
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
    args: {
      description: {
        type: GraphQLString,
      },
    },
    resolve: (parent, args, context, info) => new Promise((resolve, reject) => {
      const fields = graphqlFields(info);
      let masterProducts;

      MasterProductService.search(Map({
        fields: List()
            .concat(fields.description ? List.of('description') : List())
            .concat(fields.barcode ? List.of('barcode') : List())
            .concat(fields.imageUrl ? List.of('imageUrl') : List())
            .concat(fields.tags ? List.of('tags') : List()),
        conditions: Map({
          contains_description: args.description && args.description.trim()
              .length > 0 ? args.description.trim() : undefined,
        }),
      }))
        .then((results) => {
          masterProducts = results;

          if (fields.tags && masterProducts.find(_ => !_.get('tags')
              .isEmpty())) {
            const tagIds = masterProducts.filterNot(_ => _.get('tags')
                .isEmpty())
              .flatMap(_ => _.get('tags')).toSet().toList();

            return TagService.search(Map({
              fields: List()
                .concat(fields.tags.name ? List.of('name') : List())
                .concat(fields.tags.weight ? List.of('weight') : List()),
              conditions: Map({
                ids: tagIds,
              }),
            }));
          }

          return List();
        })
        .then((tags) => {
          if (fields.tags) {
            resolve(masterProducts.map(masterProduct => masterProduct.update('tags', tagIds => tagIds.map(tagId => tags.find(tag => tag.get(
                  'id')
                .localeCompare(tagId) === 0)))
              .toJS()));
          } else {
            resolve(masterProducts.toJS());
          }
        })
        .catch(error => reject(error));
    }),
  };
}

export {
  getMasterProductsObjectField,
};

export default getMasterProductsObjectField;
