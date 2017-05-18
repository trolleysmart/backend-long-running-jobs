// @flow

import { Map } from 'immutable';
import { GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';
import { TagService } from 'smart-grocery-parse-server-common';

const tagType = new GraphQLObjectType({
  name: 'Tag',
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

const tagsField = {
  type: new GraphQLList(tagType),
  resolve: () =>
    new Promise((resolve, reject) => {
      TagService.search(Map({})).then(info => resolve(info.toJS())).catch(error => reject(error));
    }),
};

export { tagType, tagsField };
