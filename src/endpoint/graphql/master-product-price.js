import {
  Map,
} from 'immutable';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
} from 'graphql';
import {
  MasterProductPriceService,
} from 'smart-grocery-parse-server-common';

const masterProductPriceType = new GraphQLObjectType({
  name: 'MasterProductPrice',
  fields: () => ({
    id: {
      type: GraphQLString,
    },
    specialType: {
      type: GraphQLString,
    },
    price: {
      type: GraphQLFloat,
    },
  }),
});

const masterProductPricesField = {
  type: new GraphQLList(masterProductPriceType),
  resolve: () => new Promise((resolve, reject) => {
    MasterProductPriceService.search(Map({}))
      .then(info => resolve(info.map(_ => _.merge(Map({
        specialType: _.getIn(['priceDetails', 'specialType']),
        price: _.getIn(['priceDetails', 'price']),
      })))
        .toJS()))
      .catch(error => reject(error));
  }),
};

export {
  masterProductPriceType,
  masterProductPricesField,
};
