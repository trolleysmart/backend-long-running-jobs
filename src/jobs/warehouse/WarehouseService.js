// @flow

import BluebirdPromise from 'bluebird';
import { StoreMasterProductService } from 'trolley-smart-parse-server-common';
import { ServiceBase } from '../common';

export default class WarehouseService extends ServiceBase {
  setStoreMasterProductLinkToMasterProduct = async (sessionToken) => {
    const store = await this.getStore('Warehouse', sessionToken);
    const storeId = store.get('id');
    const storeMasterProducts = await this.getAllStoreMasterProductsWithoutMasterProduct(storeId, sessionToken);
    const splittedStoreMasterProducts = this.splitIntoChunks(storeMasterProducts, 100);

    await BluebirdPromise.each(splittedStoreMasterProducts.toArray(), storeMasterProductChunks =>
      Promise.all(storeMasterProductChunks.map(storeMasterProduct => this.setMasterProductLink(storeMasterProduct, sessionToken))),
    );
  };

  setMasterProductLink = async (storeMasterProduct, sessionToken) => {
    const barcode = storeMasterProduct.get('barcode');

    if (!barcode) {
      return;
    }

    const masterProducts = await this.getMasterProducts({ barcode }, sessionToken);

    if (masterProducts.isEmpty()) {
      return;
    }

    await StoreMasterProductService.update(storeMasterProduct.set('masterProductId', masterProducts.first().get('id')), sessionToken);
  };
}
