// @flow

import BluebirdPromise from 'bluebird';
import Immutable, { Map } from 'immutable';
import { StoreTagService } from 'smart-grocery-parse-server-common';
import { ServiceBase } from '../common';

export default class WarehouseService extends ServiceBase {
  syncProductCategoriesToStoreTags = async () => {
    const store = await this.getStore('Warehouse');
    const storeId = store.get('id');
    const productCategories = Immutable.fromJS(
      (await this.getMostRecentCrawlResults('Warehouse Product Categories', info => info.getIn(['resultSet', 'productCategories']))).first(),
    );
    const storeTags = await this.getExistingStoreTags(storeId);
    const splittedLevelOneProductCategories = this.splitIntoChunks(productCategories, 100);

    await BluebirdPromise.each(splittedLevelOneProductCategories.toArray(), productCategoryChunks =>
      Promise.all(productCategoryChunks.map(productCategory => this.createOrUpdateLevelOneProductCategory(productCategory, storeTags, storeId))),
    );
  };

  createOrUpdateLevelOneProductCategory = async (productCategory, storeTags, storeId) => {
    const foundStoreTag = storeTags.find(storeTag => storeTag.get('key').localeCompare(productCategory.get('categoryKey')) === 0);

    if (foundStoreTag) {
      await StoreTagService.create(
        Map({ key: productCategory.get('categoryKey'), description: productCategory.get('description'), weigth: 1, storeId }),
      );
    } else {
      await StoreTagService.update(foundStoreTag.set('description', productCategory.get('description')).set('weigth', productCategory.get('weigth')));
    }
  };
}
