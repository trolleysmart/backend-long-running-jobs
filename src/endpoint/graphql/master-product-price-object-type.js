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

function getMasterProductPriceObjectType() {
  return new GraphQLObjectType({
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
}

function getMasterProductPricesObjectType() {
  return new GraphQLList(getMasterProductPriceObjectType());
}

function getMasterProductPricesObjectField() {
  return {
    type: getMasterProductPricesObjectType(),
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
}

export {
  getMasterProductPricesObjectField,
};

export default getMasterProductPricesObjectField;
