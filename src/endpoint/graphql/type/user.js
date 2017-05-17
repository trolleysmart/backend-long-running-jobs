import {
  List,
  Map,
} from 'immutable';
import {
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from 'graphql';
import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
} from 'graphql-relay';
import {
  MasterProductPriceService,
  ShoppingListService,
} from 'smart-grocery-parse-server-common';
import {
  NodeInterface,
} from '../interface';
import SpecialType from './specials';
import ShoppingListType from './shopping-list';

const {
  connectionType: specialsConnection,
} = connectionDefinitions({
  name: 'Special',
  nodeType: SpecialType,
});

export default new GraphQLObjectType({
  name: 'User',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: _ => _.get('id'),
    },
    username: {
      type: GraphQLString,
      resolve: _ => _.get('username'),
    },
    specials: {
      type: specialsConnection,
      args: {
        ...connectionArgs,
        description: {
          type: GraphQLString,
        },
      },
      resolve: async (_, args) => {
        const criteria = Map({
          includeStore: true,
          includeMasterProduct: true,
          conditions: Map({
            contains_masterProductDescription: args.description ? args.description.trim() : undefined,
            not_specialType: 'none',
          }),
        });

        let specials;

        if (args.first) {
          specials = await MasterProductPriceService.search(criteria.set('limit', args.first));
        } else {
          const result = MasterProductPriceService.searchAll(criteria);

          try {
            specials = List();

            result.event.subscribe((info) => {
              specials = specials.push(info);
            });

            await result.promise;
          } finally {
            result.event.unsubscribeAll();
          }
        }

        return connectionFromArray(specials.toArray(), args);
      },
    },
    shoppingList: {
      type: new GraphQLList(ShoppingListType),
      resolve: async (_) => {
        const criteria = Map({
          includeMasterProductPrices: true,
          topMost: true,
          conditions: Map({
            userId: _.get('id'),
          }),
        });

        const shoppingList = await ShoppingListService.search(criteria);

        if (shoppingList.isEmpty()) {
          return List();
        }

        const masterProductPriceIds = shoppingList.first()
          .get('masterProductPriceIds');

        if (masterProductPriceIds.isEmpty()) {
          return List();
        }

        const masterProductCriteria = Map({
          includeStore: true,
          includeMasterProduct: true,
          conditions: Map({
            id: masterProductPriceIds.first(),
          }),
        });

        const result = MasterProductPriceService.searchAll(masterProductCriteria);

        try {
          let specials = List();

          result.event.subscribe((info) => {
            specials = specials.push(info);
            console.log(`//////// ${JSON.stringify(info.toJS())}`);
          });
          await result.promise;

          return specials;
        } finally {
          result.event.unsubscribeAll();
        }
      },
    },
  },
  interfaces: [NodeInterface],
});
