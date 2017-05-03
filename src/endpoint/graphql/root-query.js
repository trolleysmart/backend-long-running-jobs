import {
  GraphQLObjectType,
} from 'graphql';
import {
  viewerField,
} from './viewer';

const rootQueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: () => ({
    viewer: viewerField,
  }),
});

export {
  rootQueryType,
};

export default {
  rootQueryType,
};
