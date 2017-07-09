// @flow

import BluebirdPromise from 'bluebird';
import { StoreMasterProductService } from 'smart-grocery-parse-server-common';
import { ServiceBase } from '../common';

export default class WarehouseService extends ServiceBase {
  setStoreMasterProductLinkToMasterProduct = async () => {
    const store = await this.getStore('Warehouse');
    const storeId = store.get('id');
    const storeMasterProducts = await this.getAllStoreMasterProductsWithoutMasterProduct(storeId);
    const splittedStoreMasterProducts = this.splitIntoChunks(storeMasterProducts, 100);

    await BluebirdPromise.each(splittedStoreMasterProducts.toArray(), storeMasterProductChunks =>
      Promise.all(storeMasterProductChunks.map(storeMasterProduct => this.setMasterProductLink(storeMasterProduct))),
    );
  };

  setMasterProductLink = async (storeMasterProduct) => {
    const masterProducts = await this.getMasterProducts({
      barcode: storeMasterProduct.get('barcode'),
    });

    if (!masterProducts.isEmpty()) {
      return;
    }

    await StoreMasterProductService.update(storeMasterProduct.set('masterProductId', masterProducts.first().get('id')));
  };
}
