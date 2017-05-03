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
  tagsField,
} from './tag';
import {
  userField,
} from './user';

const viewerType = new GraphQLObjectType({
  name: 'Viewer',
  fields: () => ({
    masterProducts: masterProductsField,
    masterProductPrices: masterProductPricesField,
    tags: tagsField,
    stores: storesField,
    user: userField,
  }),
});

const viewerField = {
  type: viewerType,
  resolve: () => ({}),
};

export {
  viewerType,
  viewerField,
};
