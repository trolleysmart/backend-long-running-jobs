import {
  GraphQLObjectType,
} from 'graphql';
import {
  masterProductsField,
} from './master-product-object-type';
import {
  masterProductPricesField,
} from './master-product-price-object-type';
import {
  storesField,
} from './store-object-type';
import {
  specialsField,
} from './specials';
import {
  tagsField,
} from './tag-object-type';
import {
  userField,
} from './user-object-type';

function getRootQueryObjectType() {
  return new GraphQLObjectType({
    name: 'RootQueryType',
    fields: () => ({
      masterProducts: masterProductsField,
      masterProductPrices: masterProductPricesField,
      tags: tagsField,
      stores: storesField,
      specials: specialsField,
      user: userField,
    }),
  });
}

export {
  getRootQueryObjectType,
};

export default getRootQueryObjectType;
