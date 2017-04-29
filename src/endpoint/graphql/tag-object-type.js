import {
  Map,
} from 'immutable';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  TagService,
} from 'smart-grocery-parse-server-common';

function getTagObjectType() {
  return new GraphQLObjectType({
    name: 'Tag',
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

function getTagsObjectType() {
  return new GraphQLList(getTagObjectType());
}

function getTagsObjectField() {
  return {
    type: getTagsObjectType(),
    resolve: () => new Promise((resolve, reject) => {
      TagService.search(Map({}))
        .then(info => resolve(info.toJS()))
        .catch(error => reject(error));
    }),
  };
}

export {
  getTagsObjectField,
};

export default getTagsObjectField;
