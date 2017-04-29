import {
  GraphQLObjectType,
} from 'graphql';
import {
  getUserObjectField,
} from './user-object-type';
import {
  getMasterProductsObjectField,
} from './master-product-object-type';

function getRootQueryObjectType() {
  return new GraphQLObjectType({
    name: 'RootQueryType',
    fields: () => ({
      user: getUserObjectField(),
      masterProducts: getMasterProductsObjectField(),
    }),
  });
}

export {
  getRootQueryObjectType,
};

export default getRootQueryObjectType;
