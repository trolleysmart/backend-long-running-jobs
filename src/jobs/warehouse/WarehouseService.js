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

    const storeTagsWithUpdatedLevelOneProductCategories = await this.getExistingStoreTags(storeId);
    const levelTwoProductCategories = productCategories
      .map(productCategory =>
        productCategory.update('subCategories', subCategories =>
          subCategories.map(subCategory => subCategory.set('parent', productCategory.get('categoryKey'))),
        ),
      )
      .flatMap(productCategory => productCategory.get('subCategories'));
    const levelTwoProductCategoriesGroupedByCategoryKey = levelTwoProductCategories.groupBy(productCategory => productCategory.get('categoryKey'));
    const splittedLevelTwoProductCategories = this.splitIntoChunks(levelTwoProductCategoriesGroupedByCategoryKey.valueSeq(), 100);

    await BluebirdPromise.each(splittedLevelTwoProductCategories.toArray(), productCategoryChunks =>
      Promise.all(
        productCategoryChunks.map(productCategory =>
          this.createOrUpdateLevelTwoProductCategory(productCategory, storeTagsWithUpdatedLevelOneProductCategories, storeId),
        ),
      ),
    );

    const storeTagsWithUpdatedLevelTwoProductCategories = await this.getExistingStoreTags(storeId);
    const levelThreeProductCategories = productCategories
      .flatMap(productCategory => productCategory.get('subCategories'))
      .map(productCategory =>
        productCategory.update('subCategories', subCategories =>
          subCategories.map(subCategory => subCategory.set('parent', productCategory.get('categoryKey'))),
        ),
      )
      .flatMap(productCategory => productCategory.get('subCategories'));
    const levelThreeProductCategoriesGroupedByCategoryKey = levelThreeProductCategories.groupBy(productCategory =>
      productCategory.get('categoryKey'),
    );
    const splittedLevelThreeProductCategories = this.splitIntoChunks(levelThreeProductCategoriesGroupedByCategoryKey.valueSeq(), 100);

    await BluebirdPromise.each(splittedLevelThreeProductCategories.toArray(), productCategoryChunks =>
      Promise.all(
        productCategoryChunks.map(productCategory =>
          this.createOrUpdateLevelThreeProductCategory(productCategory, storeTagsWithUpdatedLevelTwoProductCategories, storeId),
        ),
      ),
    );
  };

  createOrUpdateLevelOneProductCategory = async (productCategory, storeTags, storeId) => {
    const foundStoreTag = storeTags.find(storeTag => storeTag.get('key').localeCompare(productCategory.get('categoryKey')) === 0);

    if (foundStoreTag) {
      await StoreTagService.update(foundStoreTag.set('description', productCategory.get('description')).set('weight', productCategory.get('weigth')));
    } else {
      await StoreTagService.create(
        Map({ key: productCategory.get('categoryKey'), description: productCategory.get('description'), weight: 1, storeId }),
      );
    }
  };

  createOrUpdateLevelTwoProductCategory = async (productCategory, storeTags, storeId) => {
    const foundStoreTag = storeTags.find(storeTag => storeTag.get('key').localeCompare(productCategory.first().get('categoryKey')) === 0);
    const parentStoreTagIds = productCategory
      .map(_ => _.get('parent'))
      .map(parent => storeTags.find(storeTag => storeTag.get('key').localeCompare(parent) === 0))
      .map(_ => _.get('id'));

    if (foundStoreTag) {
      await StoreTagService.update(
        foundStoreTag
          .set('description', productCategory.first().get('description'))
          .set('weight', productCategory.first().get('weigth'))
          .set('storeTagIds', parentStoreTagIds),
      );
    } else {
      await StoreTagService.create(
        Map({
          key: productCategory.first().get('categoryKey'),
          description: productCategory.first().get('description'),
          weight: 2,
          storeId,
          storeTagIds: parentStoreTagIds,
        }),
      );
    }
  };

  createOrUpdateLevelThreeProductCategory = async (productCategory, storeTags, storeId) => {
    const foundStoreTag = storeTags.find(storeTag => storeTag.get('key').localeCompare(productCategory.first().get('categoryKey')) === 0);
    const parentStoreTagIds = productCategory
      .map(_ => _.get('parent'))
      .map(parent => storeTags.find(storeTag => storeTag.get('key').localeCompare(parent) === 0))
      .map(_ => _.get('id'));

    if (foundStoreTag) {
      await StoreTagService.update(
        foundStoreTag
          .set('description', productCategory.first().get('description'))
          .set('weight', productCategory.first().get('weigth'))
          .set('storeTagIds', parentStoreTagIds),
      );
    } else {
      await StoreTagService.create(
        Map({
          key: productCategory.first().get('categoryKey'),
          description: productCategory.first().get('description'),
          weight: 3,
          storeId,
          storeTagIds: parentStoreTagIds,
        }),
      );
    }
  };
}
