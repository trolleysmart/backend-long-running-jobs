// @flow

import BluebirdPromise from 'bluebird';
import { Map } from 'immutable';
import { MasterProductService, StoreTagService, StoreMasterProductService, TagService } from 'smart-grocery-parse-server-common';
import { ServiceBase } from '../common';

export default class CountdownService extends ServiceBase {
  syncTags = async () => {
    const store = await this.getStore('Countdown');
    const storeId = store.get('id');
    const storeTags = await this.getStoreTags(storeId);

    await this.syncLevelOneTags(storeTags);
    await this.syncLevelTwoTags(storeTags);
    await this.syncLevelThreeTags(storeTags);
  };

  syncLevelOneTags = async (storeTags) => {
    const levelOneTags = await this.getTags(1);
    const levelOneStoreTags = storeTags.filter(storeTag => storeTag.get('weight') === 1);
    const levelOneTagsToCreate = levelOneStoreTags.filterNot(storeTag =>
      levelOneTags.find(tag => tag.get('key').localeCompare(storeTag.get('key') === 0)),
    );

    const splittedTags = this.splitIntoChunks(levelOneTagsToCreate, 100);

    await BluebirdPromise.each(splittedTags.toArray(), tagsChunks =>
      Promise.all(tagsChunks.map(tag => TagService.create(tag.delete('storeTags').delete('tag').delete('store').delete('url'))).toArray()),
    );
  };

  syncLevelTwoTags = async (storeTags) => {
    const levelOneTags = await this.getTags(1);
    const levelTwoTags = await this.getTags(2);
    const levelOneStoreTags = storeTags.filter(storeTag => storeTag.get('weight') === 1);
    const levelTwoStoreTags = storeTags.filter(storeTag => storeTag.get('weight') === 2);
    const levelTwoTagsToCreate = levelTwoStoreTags.filterNot(storeTag =>
      levelTwoTags.find(tag => tag.get('key').localeCompare(storeTag.get('key') === 0)),
    );

    const splittedTags = this.splitIntoChunks(levelTwoTagsToCreate, 100);

    await BluebirdPromise.each(splittedTags.toArray(), tagsChunks =>
      Promise.all(
        tagsChunks
          .map(tag =>
            TagService.create(
              tag
                .delete('storeTags')
                .delete('tag')
                .delete('store')
                .delete('url')
                .set(
                  'tagIds',
                  tag
                    .get('storeTagIds')
                    .map(storeTagId => levelOneStoreTags.find(levelOneStoreTag => levelOneStoreTag.get('id').localeCompare(storeTagId) === 0))
                    .map(levelOneStoreTag =>
                      levelOneTags.find(levelOneTag => levelOneTag.get('key').localeCompare(levelOneStoreTag.get('key')) === 0),
                    )
                    .map(levelOneTag => levelOneTag.get('id')),
                ),
            ),
          )
          .toArray(),
      ),
    );
  };

  syncLevelThreeTags = async (storeTags) => {
    const levelTwoTags = await this.getTags(2);
    const levelThreeTags = await this.getTags(3);
    const levelTwoStoreTags = storeTags.filter(storeTag => storeTag.get('weight') === 2);
    const levelThreeStoreTags = storeTags.filter(storeTag => storeTag.get('weight') === 3);
    const levelThreeTagsToCreate = levelThreeStoreTags.filterNot(storeTag =>
      levelThreeTags.find(tag => tag.get('key').localeCompare(storeTag.get('key') === 0)),
    );

    const splittedTags = this.splitIntoChunks(levelThreeTagsToCreate, 100);

    await BluebirdPromise.each(splittedTags.toArray(), tagsChunks =>
      Promise.all(
        tagsChunks
          .map(tag =>
            TagService.create(
              tag
                .delete('storeTags')
                .delete('tag')
                .delete('store')
                .delete('url')
                .set(
                  'tagIds',
                  tag
                    .get('storeTagIds')
                    .map(storeTagId => levelTwoStoreTags.find(levelTwoStoreTag => levelTwoStoreTag.get('id').localeCompare(storeTagId) === 0))
                    .map(levelTwoStoreTag =>
                      levelTwoTags.find(levelTwoTag => levelTwoTag.get('key').localeCompare(levelTwoStoreTag.get('key')) === 0),
                    )
                    .map(levelTwoTag => levelTwoTag.get('id')),
                ),
            ),
          )
          .toArray(),
      ),
    );
  };

  updateStoreTags = async () => {
    const store = await this.getStore('Countdown');
    const storeId = store.get('id');
    const storeTags = await this.getStoreTags(storeId);
    const tags = await this.getTags();

    const splittedStoreTags = this.splitIntoChunks(storeTags, 100);

    await BluebirdPromise.each(splittedStoreTags.toArray(), storeTagsChunks =>
      Promise.all(
        storeTagsChunks
          .map((storeTag) => {
            const foundTag = tags.find(tag => tag.get('key').localeCompare(storeTag.get('key')) === 0);

            return StoreTagService.update(storeTag.set('tagId', foundTag ? foundTag.get('id') : null));
          })
          .toArray(),
      ),
    );
  };

  syncStoreMasterProductsToMasterProducts = async () => {
    const store = await this.getStore('Countdown');
    const storeId = store.get('id');
    const storeTags = await this.getStoreTags(storeId, true);
    const storeMasterProducts = await this.getAllStoreMasterProductsWithoutMasterProduct(storeId);
    const splittedStoreMasterProducts = this.splitIntoChunks(storeMasterProducts, 100);

    await BluebirdPromise.each(splittedStoreMasterProducts.toArray(), storeMasterProductChunks =>
      Promise.all(storeMasterProductChunks.map(storeMasterProduct => this.setMasterProductLink(storeMasterProduct, storeTags))),
    );
  };

  setMasterProductLink = async (storeMasterProduct, storeTags) => {
    const masterProducts = await this.getMasterProducts({
      name: storeMasterProduct.get('name'),
      description: storeMasterProduct.get('description'),
      barcode: storeMasterProduct.get('barcode'),
      size: storeMasterProduct.get('size'),
    });

    if (!masterProducts.isEmpty()) {
      await StoreMasterProductService.update(storeMasterProduct.set('masterProductId', masterProducts.first().get('id')));

      return;
    }

    const masterProductId = await MasterProductService.create(
      Map({
        name: storeMasterProduct.get('name'),
        description: storeMasterProduct.get('description'),
        imageUrl: storeMasterProduct.get('imageUrl'),
        barcode: storeMasterProduct.get('barcode'),
        size: storeMasterProduct.get('size'),
        tagIds: storeMasterProduct
          .get('storeTagIds')
          .map(storeTagId => storeTags.find(storeTag => storeTag.get('id').localeCompare(storeTagId) === 0))
          .map(storeTag => storeTag.get('tagId')),
      }),
    );

    await StoreMasterProductService.update(storeMasterProduct.set('masterProductId', masterProductId));
  };
}
