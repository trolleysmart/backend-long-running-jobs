import {
  GraphQLObjectType,
} from 'graphql';
import {
  masterProductsField,
} from './master-product';
import {
  masterProductPricesField,
} from './master-product-price';
import {
  storesField,
} from './store';
import {
  specialsField,
} from './specials';
import {
  tagsField,
} from './tag';
import {
  userField,
} from './user';

const rootQueryType = new GraphQLObjectType({
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

export {
  rootQueryType,
};

export default {
  rootQueryType,
};
