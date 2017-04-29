import {
  GraphQLObjectType,
} from 'graphql';
import {
  getMasterProductsObjectField,
} from './master-product-object-type';
import {
  getMasterProductPricesObjectField,
} from './master-product-price-object-type';
import {
  getStoresObjectField,
} from './store-object-type';
import {
  getTagsObjectField,
} from './tag-object-type';
import {
  getUserObjectField,
} from './user-object-type';

function getRootQueryObjectType() {
  return new GraphQLObjectType({
    name: 'RootQueryType',
    fields: () => ({
      masterProducts: getMasterProductsObjectField(),
      masterProductPrices: getMasterProductPricesObjectField(),
      tags: getTagsObjectField(),
      stores: getStoresObjectField(),
      user: getUserObjectField(),
    }),
  });
}

export {
  getRootQueryObjectType,
};

export default getRootQueryObjectType;
