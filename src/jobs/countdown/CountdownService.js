// @flow

import BluebirdPromise from 'bluebird';
import { List, Map } from 'immutable';
import { Exception } from 'micro-business-parse-server-common';
import {
  StoreCrawlerConfigurationService,
  MasterProductService,
  MasterProductPriceService,
  StoreTagService,
} from 'smart-grocery-parse-server-common';
import { ServiceBase } from '../common';

export default class CountdownService extends ServiceBase {
  updateProductTags = async (key, productsGroupedByDescription, existingTags) => {
    const product = productsGroupedByDescription.get(key).first();
    const results = await MasterProductService.search(
      Map({
        conditions: product,
      }),
    );

    if (results.isEmpty()) {
      throw new Exception(`No master product found for: ${JSON.stringify(product.toJS())}`);
    } else if (results.count() > 1) {
      throw new Exception(`Multiple master products found for: ${JSON.stringify(product.toJS())}`);
    }

    const existingProduct = results.first();
    const tags = productsGroupedByDescription.get(key).map(_ => _.get('productCategory')).toSet();
    const notFoundTags = tags.filterNot(tag =>
      existingTags.find(existingTag => existingTag.get('key').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0),
    );

    if (!notFoundTags.isEmpty()) {
      throw new Exception(`Tags not found in existing tag list: ${JSON.stringify(notFoundTags.toJS())}`);
    }

    const tagIds = tags.map(tag =>
      existingTags.find(existingTag => existingTag.get('key').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0).get('id'),
    );
    const newTagIds = tagIds.filterNot(tagId => existingProduct.get('tagIds').find(id => id === tagId));

    if (newTagIds.isEmpty()) {
      return;
    }

    await MasterProductService.update(
      existingProduct.update('tagIds', (currentTags) => {
        if (currentTags) {
          return currentTags.concat(newTagIds);
        }

        return newTagIds;
      }),
    );
  };

  getSpecialType = (product) => {
    if (product.has('special') && product.get('special')) {
      return 'special';
    }

    if (product.has('onecard') && product.get('onecard')) {
      return 'onecard';
    }

    if ((product.has('specialMultiBuyText') && product.get('specialMultiBuyText')) || (product.has('multiBuyText') && product.get('multiBuyText'))) {
      return 'multibuy';
    }

    return 'none';
  };

  getPrice = (product) => {
    const specialType = this.getSpecialType(product);
    const price = product.get('price');

    if (specialType.localeCompare('special') === 0) {
      return price.substring(1, price.indexOf(' '));
    } else if (specialType.localeCompare('onecard') === 0) {
      if (product.has('nonClubPrice')) {
        const nonClubPrice = product.get('nonClubPrice');

        return nonClubPrice.substring(nonClubPrice.indexOf('$') + 1);
      }

      return price.substring(1, price.indexOf(' '));
    } else if (specialType.localeCompare('multibuy') === 0) {
      return price.substring(1, price.indexOf(' '));
    }

    return price.substring(1, price.indexOf(' '));
  };

  getWasPrice = (product) => {
    const specialType = this.getSpecialType(product);

    if (specialType.localeCompare('special') === 0) {
      return product.has('wasPrice') ? product.get('wasPrice').substring(product.get('wasPrice').indexOf('$') + 1) : undefined;
    } else if (specialType.localeCompare('onecard') === 0) {
      if (product.has('clubPrice')) {
        const clubPrice = product.get('clubPrice');

        return clubPrice.substring(1, clubPrice.indexOf(' '));
      }

      return undefined;
    } else if (specialType.localeCompare('multibuy') === 0) {
      return undefined;
    }

    return undefined;
  };

  getMultiBuyInfo = (product) => {
    const specialType = this.getSpecialType(product);

    if (specialType.localeCompare('multibuy') === 0) {
      if (product.has('specialMultiBuyText')) {
        const specialMultiBuyText = product.get('specialMultiBuyText');

        return Map({
          count: parseInt(specialMultiBuyText.substring(0, specialMultiBuyText.indexOf('for')), 10),
          price: this.convertPriceStringToDecimal(specialMultiBuyText.substring(specialMultiBuyText.indexOf('for') + 'for'.length)),
        });
      } else if (product.has('multiBuyText')) {
        const multiBuyText = product.get('multiBuyText');

        return Map({
          count: parseInt(multiBuyText.substring(0, multiBuyText.indexOf(' ')), 10),
          price: this.convertPriceStringToDecimal(multiBuyText.substring(multiBuyText.indexOf('for ') + 'for '.length)),
        });
      }

      return undefined;
    }

    return undefined;
  };

  convertPriceStringToDecimal = (price) => {
    if (price) {
      return parseFloat(price);
    }

    return undefined;
  };

  updateStoreCralwerProductCategoriesConfiguration = async (config) => {
    const finalConfig = config || (await this.getJobConfig());
    const currentStoreConfig = await this.getStoreCrawlerConfig('Countdown');
    const highLevelProductCategories = (await this.getMostRecentCrawlResults('Countdown High Level Product Categories', info =>
      info.getIn(['resultSet', 'highLevelProductCategories']),
    )).first();

    this.logInfo(finalConfig, () => 'Updating new Store Crawler config for Countdown...');

    const newConfig = currentStoreConfig.setIn(['config', 'productCategories'], highLevelProductCategories);

    this.logVerbose(finalConfig, () => `New Store Crawler config for Countdown: ${JSON.stringify(newConfig)}`);

    await StoreCrawlerConfigurationService.create(newConfig);

    this.logInfo(finalConfig, () => 'Updated new Store Crawler config for Countdown.');
  };

  syncToMasterProductList = async (config) => {
    const finalConfig = config || (await this.getJobConfig());
    const products = await this.getMostRecentCrawlResults('Countdown Products', info =>
      info.getIn(['resultSet', 'products']).filterNot(product => product.get('description').trim().length === 0),
    );
    const productsWithoutDuplication = products.groupBy(_ => _.get('description')).map(_ => _.first()).valueSeq();
    const splittedProducts = this.splitIntoChunks(productsWithoutDuplication, 100);

    await BluebirdPromise.each(splittedProducts.toArray(), productChunks =>
      Promise.all(productChunks.map(product => this.createOrUpdateMasterProduct(product, finalConfig))),
    );
  };

  createOrUpdateMasterProduct = async (product, config) => {
    const results = await MasterProductService.search(
      Map({
        conditions: Map({
          description: product.get('description'),
        }),
      }),
    );

    if (results.isEmpty()) {
      this.logInfo(config, () => 'Creating new master product...');

      await MasterProductService.create(
        Map({
          description: product.get('description'),
          barcode: product.get('barcode'),
          imageUrl: product.get('imageUrl'),
        }),
      );
    } else if (results.count() > 1) {
      throw new Exception(`Multiple master product found for product: ${JSON.stringify(product.toJS())}`);
    } else {
      this.logInfo(config, () => 'Updating an existing master product...');

      const productInfo = results.first();

      await MasterProductService.update(productInfo.set('imageUrl', product.get('imageUrl')).set('barcode', product.get('barcode')));
    }
  };

  syncToMasterProductPriceList = async (config) => {
    const finalConfig = config || (await this.getJobConfig());
    const store = await this.getStore('Countdown');
    const products = await this.getMostRecentCrawlResults('Countdown Products', info =>
      info.getIn(['resultSet', 'products']).filterNot(product => product.get('description').trim().length === 0),
    );
    const productsWithoutDuplication = products.groupBy(_ => _.get('description')).map(_ => _.first()).valueSeq();
    const effectiveFrom = new Date();
    const splittedProducts = this.splitIntoChunks(productsWithoutDuplication, 100);

    await BluebirdPromise.each(splittedProducts.toArray(), productChunks =>
      Promise.all(productChunks.map(product => this.createOrUpdateMasterProductPrice(product, finalConfig, effectiveFrom, store))),
    );
    await this.clearOldMasterProductPrices(finalConfig, effectiveFrom);
  };

  createOrUpdateMasterProductPrice = async (product, config, effectiveFrom, store) => {
    const masterProductPriceResults = await MasterProductPriceService.search(
      Map({
        conditions: Map({
          description: product.get('description'),
          storeId: store.get('id'),
        }),
      }),
    );

    if (masterProductPriceResults.isEmpty()) {
      this.logVerbose(config, () => 'Creating new master product price....');

      const masterProductResults = await MasterProductService.search(
        Map({
          conditions: product,
        }),
      );

      if (masterProductResults.isEmpty()) {
        throw new Exception(`No master product found for: ${JSON.stringify(product.toJS())}`);
      } else if (masterProductResults.count() > 1) {
        throw new Exception(`Multiple master products found for: ${JSON.stringify(product.toJS())}`);
      }

      const masterProduct = masterProductResults.first();
      const masterProductPriceInfo = Map({
        masterProductId: masterProduct.get('id'),
        description: masterProduct.get('description'),
        storeId: store.get('id'),
        storeName: store.get('name'),
        effectiveFrom,
        priceDetails: Map({
          specialType: this.getSpecialType(product),
          price: this.convertPriceStringToDecimal(this.getPrice(product)),
          wasPrice: this.convertPriceStringToDecimal(this.getWasPrice(product)),
          multiBuyInfo: this.getMultiBuyInfo(product),
        }),
      });

      await MasterProductPriceService.create(masterProductPriceInfo);
    } else if (masterProductPriceResults.count() > 1) {
      throw new Exception(
        `Multiple master product price found for product: ${JSON.stringify(product.toJS())} and storeId: ${store.get('id')} - ${store.get('name')}`,
      );
    } else {
      this.logVerbose(config, () => 'Updating existing master product price....');
      const masterProductPriceInfo = masterProductPriceResults.first();

      await MasterProductPriceService.update(
        masterProductPriceInfo
          .set(
            'priceDetails',
            Map({
              specialType: this.getSpecialType(product),
              price: this.convertPriceStringToDecimal(this.getPrice(product)),
              wasPrice: this.convertPriceStringToDecimal(this.getWasPrice(product)),
              multiBuyInfo: this.getMultiBuyInfo(product),
            }),
          )
          .set('effectiveFrom', effectiveFrom),
      );
    }
  };

  clearOldMasterProductPrices = async (config, effectiveFrom) => {
    this.logInfo(config, () => 'Start clearing old price details...');

    const dateToCleanFrom = new Date();
    dateToCleanFrom.setDate(new Date().getDate() - 2);

    let masterProductPrices = List();

    const result = MasterProductPriceService.searchAll(
      Map({
        conditions: Map({
          lessThanOrEqualTo_effectiveFrom: dateToCleanFrom,
        }),
      }),
    );

    try {
      result.event.subscribe(info => (masterProductPrices = masterProductPrices.push(info)));

      await result.promise;
    } finally {
      result.event.unsubscribeAll();
    }

    const splittedMasterProductPrices = this.splitIntoChunks(masterProductPrices, 100);

    await BluebirdPromise.each(splittedMasterProductPrices.toArray(), masterProductPriceChunks =>
      Promise.all(
        masterProductPriceChunks.map(masterProductPrice =>
          MasterProductPriceService.update(masterProductPrice.set('priceDetails', Map()).set('effectiveFrom', effectiveFrom)),
        ),
      ),
    );

    this.logInfo(config, () => 'Finished clearing old price details.');
  };

  syncToTagList = async () => {
    const store = await this.getStore('Countdown');
    const storeId = store.get('id');
    const existingStoreTags = await this.getExistingStoreTags(storeId);
    const tags = (await this.getMostRecentCrawlResults('Countdown High Level Product Categories', info =>
      info.getIn(['resultSet', 'highLevelProductCategories']),
    ))
      .first()
      .toSet();
    const newTags = tags.filterNot(tag =>
      existingStoreTags.find(storeTag => storeTag.get('key').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0),
    );

    await Promise.all(
      newTags
        .map(tag =>
          StoreTagService.create(
            Map({
              key: tag,
              weight: 1,
              storeId,
            }),
          ),
        )
        .toArray(),
    );
  };

  syncMasterProductTags = async (config) => {
    const finalConfig = config || (await this.getJobConfig());
    const existingTags = await this.getExistingTags();
    const products = await this.getMostRecentCrawlResults('Countdown Products', (info) => {
      const resultSet = info.get('resultSet');
      return resultSet
        .get('products')
        .filterNot(product => product.get('description').trim().length === 0)
        .map(product => product.set('productCategory', resultSet.get('productCategory')));
    });
    const productsGroupedByDescription = products.groupBy(_ => _.get('description'));

    this.logVerbose(finalConfig, () => 'Finding the product in master product...');

    const keys = productsGroupedByDescription.keySeq();

    if (keys.isEmpty()) {
      return;
    }

    const splittedKeys = this.splitIntoChunks(keys, 100);

    await BluebirdPromise.each(splittedKeys.toArray(), keyChunks =>
      Promise.all(keyChunks.map(key => this.updateProductTags(key, productsGroupedByDescription, existingTags))),
    );
  };
}
