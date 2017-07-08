// @flow

import { List, Map } from 'immutable';
import { ServiceBase as StoreCrawlerServiceBase } from 'store-crawler';
import { MasterProductService, StoreMasterProductService, TagService } from 'smart-grocery-parse-server-common';

export default class ServiceBase extends StoreCrawlerServiceBase {
  getTags = async (weight) => {
    const result = TagService.searchAll(Map({ conditions: Map({ weight: weight || undefined }) }));

    try {
      let tags = List();

      result.event.subscribe(info => (tags = tags.push(info)));

      await result.promise;

      return tags;
    } finally {
      result.event.unsubscribeAll();
    }
  };

  getAllStoreMasterProductsWithoutMasterProductLinkSet = async (storeId) => {
    const criteria = Map({
      conditions: Map({
        storeId,
        without_masterProduct: true,
      }),
    });

    let products = List();
    const result = StoreMasterProductService.searchAll(criteria);

    try {
      result.event.subscribe(info => (products = products.push(info)));

      await result.promise;
    } finally {
      result.event.unsubscribeAll();
    }

    return products;
  };

  getMasterProducts = async ({ name, description, barcode, size }) => {
    const criteria = Map({
      conditions: Map({ name, description, barcode, size }),
    });

    return MasterProductService.search(criteria);
  };
}
