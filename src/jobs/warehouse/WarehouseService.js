// @flow

import BluebirdPromise from 'bluebird';
import { ServiceBase } from '../common';

export default class WarehouseService extends ServiceBase {
  syncProductCategoriesToStoreTags = async () => {
    const store = await this.getStore('Warehouse');
    const storeId = store.get('id');
    const productCategories = (await this.getMostRecentCrawlResults('Warehouse Product Categories', info =>
      info.getIn(['resultSet', 'productCategories']),
    )).first();
    const storeTags = await this.getExistingStoreTags(storeId);
    const splittedLevelOneProductCategories = this.splitIntoChunks(productCategories, 100);
  };

  createOrUpdateLevelOneProductCategory = async (productCategory, storeTags, storeId) => {
    storeTags.find(storeTag => storeTag.get('key').localeCompare(productCategory) === 0);
  };
}
