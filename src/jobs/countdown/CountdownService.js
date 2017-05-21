// @flow

import BluebirdPromise from 'bluebird';
import Immutable, { List, Map, Range, Set } from 'immutable';
import { ParseWrapperService, Exception } from 'micro-business-parse-server-common';
import {
  CrawlResultService,
  CrawlSessionService,
  StoreCrawlerConfigurationService,
  MasterProductService,
  MasterProductPriceService,
  StoreService,
  TagService,
} from 'smart-grocery-parse-server-common';

export default class CountdownService {
  static splitIntoChunks = (list, chunkSize) => Range(0, list.count(), chunkSize).map(chunkStart => list.slice(chunkStart, chunkStart + chunkSize));

  static getConfig = async () => {
    const config = await ParseWrapperService.getConfig();
    const jobConfig = config.get('Job');

    if (jobConfig) {
      return Immutable.fromJS(jobConfig);
    }

    throw new Exception('No config found called Job.');
  };

  static getCountdownStore = async () => {
    const criteria = Map({
      conditions: Map({
        name: 'Countdown',
      }),
    });

    const results = await StoreService.search(criteria);

    if (results.isEmpty()) {
      throw new Exception('No store found called Countdown.');
    } else if (results.count() === 1) {
      return results.first();
    } else {
      throw new Exception('Multiple store found called Countdown.');
    }
  };

  static getExistingTags = async () => {
    const result = TagService.searchAll(Map());

    try {
      let tags = List();

      result.event.subscribe(info => (tags = tags.push(info)));

      await result.promise;

      return tags;
    } finally {
      result.event.unsubscribeAll();
    }
  };

  static updateProductTags = async (key, productsGroupedByDescription, existingTags) => {
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
      existingTags.find(existingTag => existingTag.get('name').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0),
    );

    if (!notFoundTags.isEmpty()) {
      throw new Exception(`Tags not found in existing tag list: ${JSON.stringify(notFoundTags.toJS())}`);
    }

    const tagIds = tags.map(tag =>
      existingTags.find(existingTag => existingTag.get('name').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0).get('id'),
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

  static getSpecialType = (product) => {
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

  static getPrice = (product) => {
    const specialType = CountdownService.getSpecialType(product);
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

  static getWasPrice = (product) => {
    const specialType = CountdownService.getSpecialType(product);

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

  static getMultiBuyInfo = (product) => {
    const specialType = CountdownService.getSpecialType(product);

    if (specialType.localeCompare('multibuy') === 0) {
      if (product.has('specialMultiBuyText')) {
        const specialMultiBuyText = product.get('specialMultiBuyText');

        return Map({
          count: parseInt(specialMultiBuyText.substring(0, specialMultiBuyText.indexOf('for')), 10),
          price: CountdownService.convertPriceStringToDecimal(specialMultiBuyText.substring(specialMultiBuyText.indexOf('for') + 'for'.length)),
        });
      } else if (product.has('multiBuyText')) {
        const multiBuyText = product.get('multiBuyText');

        return Map({
          count: parseInt(multiBuyText.substring(0, multiBuyText.indexOf(' ')), 10),
          price: CountdownService.convertPriceStringToDecimal(multiBuyText.substring(multiBuyText.indexOf('for ') + 'for '.length)),
        });
      }

      return undefined;
    }

    return undefined;
  };

  static convertPriceStringToDecimal = (price) => {
    if (price) {
      return parseFloat(price);
    }

    return undefined;
  };

  constructor({ logVerboseFunc, logInfoFunc, logErrorFunc }) {
    this.logVerboseFunc = logVerboseFunc;
    this.logInfoFunc = logInfoFunc;
    this.logErrorFunc = logErrorFunc;
  }

  updateStoreCralwerProductCategoriesConfiguration = async (config) => {
    const finalConfig = config || (await CountdownService.getConfig());

    this.logInfo(finalConfig, () => 'Fetching store crawler configuration...'); // eslint-disable-line max-len

    const currentConfig = await StoreCrawlerConfigurationService.search(
      Map({
        conditions: Map({
          name: 'Countdown',
        }),
        topMost: true,
      }),
    );

    this.logInfo(finalConfig, () => 'Fetched store crawler configuration.'); // eslint-disable-line max-len

    this.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown High Level Product Categories...'); // eslint-disable-line max-len

    const crawlSessionInfos = await CrawlSessionService.search(
      Map({
        conditions: Map({
          sessionKey: 'Countdown High Level Product Categories',
        }),
        topMost: true,
      }),
    );

    this.logInfo(finalConfig, () => 'Fetched the most recent Countdown crawling result for Countdown High Level Product Categories.'); // eslint-disable-line max-len

    this.logVerbose(finalConfig, () => `Current Store Crawler config for Countdown: ${currentConfig}`);

    const crawlResults = await CrawlResultService.search(
      Map({
        conditions: Map({
          crawlSessionId: crawlSessionInfos.first().get('id'),
        }),
      }),
    );

    const highLevelProductCategories = Immutable.fromJS(crawlResults.first().getIn(['resultSet', 'highLevelProductCategories']));

    this.logInfo(finalConfig, () => 'Updating new Store Crawler config for Countdown...');

    const newConfig = currentConfig.first().setIn(['config', 'productCategories'], highLevelProductCategories);

    this.logVerbose(finalConfig, () => `New Store Crawler config for Countdown: ${JSON.stringify(newConfig)}`);

    await StoreCrawlerConfigurationService.create(newConfig);

    this.logInfo(finalConfig, () => 'Updated new Store Crawler config for Countdown.');
  };

  syncToMasterProductList = async (config) => {
    const finalConfig = config || (await CountdownService.getConfig());

    this.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown Products...');

    const crawlSessionInfos = await CrawlSessionService.search(
      Map({
        conditions: Map({
          sessionKey: 'Countdown Products',
        }),
        topMost: true,
      }),
    );

    const sessionInfo = crawlSessionInfos.first();
    const sessionId = sessionInfo.get('id');
    let products = List();

    this.logInfo(finalConfig, () => `Fetched the most recent Countdown crawling result for Countdown Products. Session Id: ${sessionId}`);

    const result = CrawlResultService.searchAll(
      Map({
        conditions: Map({
          crawlSessionId: sessionId,
        }),
      }),
    );

    try {
      result.event.subscribe(
        info => (products = products.concat(info.getIn(['resultSet', 'products']).filterNot(_ => _.get('description').trim().length === 0))),
      );

      await result.promise;
    } finally {
      result.event.unsubscribeAll();
    }

    const productsWithoutDuplication = products.groupBy(_ => _.get('description')).map(_ => _.first()).valueSeq();
    const splittedProducts = CountdownService.splitIntoChunks(productsWithoutDuplication, 100);

    await BluebirdPromise.each(splittedProducts.toArray(), productChunks =>
      Promise.all(productChunks.map(product => this.createOrUpdateMasterProduct(product, finalConfig))),
    );
  };

  createOrUpdateMasterProduct = async (product, config) => {
    const results = await MasterProductService.search(
      Map({
        conditions: product,
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
    const finalConfig = config || (await CountdownService.getConfig());
    const store = await CountdownService.getCountdownStore();

    this.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown Products Price...');

    const crawlSessionInfos = await CrawlSessionService.search(
      Map({
        conditions: Map({
          sessionKey: 'Countdown Products',
        }),
        topMost: true,
      }),
    );

    const sessionInfo = crawlSessionInfos.first();
    const sessionId = sessionInfo.get('id');
    let products = List();

    this.logInfo(finalConfig, () => `Fetched the most recent Countdown crawling result for Countdown Products Price. Session Id: ${sessionId}`);

    const result = CrawlResultService.searchAll(
      Map({
        conditions: Map({
          crawlSessionId: sessionId,
        }),
      }),
    );

    try {
      result.event.subscribe(
        info => (products = products.concat(info.getIn(['resultSet', 'products']).filterNot(_ => _.get('description').trim().length === 0))),
      );

      await result.promise;
    } finally {
      result.event.unsubscribeAll();
    }

    const productsWithoutDuplication = products.groupBy(_ => _.get('description')).map(_ => _.first()).valueSeq();
    const capturedDate = new Date();
    const splittedProducts = CountdownService.splitIntoChunks(productsWithoutDuplication, 100);

    await BluebirdPromise.each(splittedProducts.toArray(), productChunks =>
      Promise.all(productChunks.map(product => this.createOrUpdateMasterProductPrice(product, finalConfig, capturedDate, store.get('id')))),
    );
    await this.clearOldMasterProductPrices(finalConfig, capturedDate);
  };

  createOrUpdateMasterProductPrice = async (product, config, capturedDate, storeId) => {
    const masterProductPriceResults = await MasterProductPriceService.search(
      Map({
        conditions: Map({
          masterProductDescription: product.get('description'),
          storeId,
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
        storeId,
        capturedDate,
        priceDetails: Map({
          specialType: CountdownService.getSpecialType(product),
          price: CountdownService.convertPriceStringToDecimal(CountdownService.getPrice(product)),
          wasPrice: CountdownService.convertPriceStringToDecimal(CountdownService.getWasPrice(product)),
          multiBuyInfo: CountdownService.getMultiBuyInfo(product),
        }),
      });

      await MasterProductPriceService.create(masterProductPriceInfo);
    } else if (masterProductPriceResults.count() > 1) {
      throw new Exception(`Multiple master product price found for product: ${JSON.stringify(product.toJS())} and storeId: ${storeId}`);
    } else {
      this.logVerbose(config, () => 'Updating existing master product price....');
      const masterProductPriceInfo = masterProductPriceResults.first();

      await MasterProductPriceService.update(
        masterProductPriceInfo
          .set(
            'priceDetails',
            Map({
              specialType: CountdownService.getSpecialType(product),
              price: CountdownService.convertPriceStringToDecimal(CountdownService.getPrice(product)),
              wasPrice: CountdownService.convertPriceStringToDecimal(CountdownService.getWasPrice(product)),
              multiBuyInfo: CountdownService.getMultiBuyInfo(product),
            }),
          )
          .set('capturedDate', capturedDate),
      );
    }
  };

  clearOldMasterProductPrices = async (config, capturedDate) => {
    this.logInfo(config, () => 'Start clearing old price details...');

    const dateToCleanFrom = new Date();
    dateToCleanFrom.setDate(new Date().getDate() - 2);

    let masterProductPrices = List();

    const result = MasterProductPriceService.searchAll(
      Map({
        conditions: Map({
          lessThanOrEqualTo_capturedDate: dateToCleanFrom,
        }),
      }),
    );

    try {
      result.event.subscribe(info => (masterProductPrices = masterProductPrices.push(info)));

      await result.promise;
    } finally {
      result.event.unsubscribeAll();
    }

    console.log(masterProductPrices.count());

    const splittedMasterProductPrices = CountdownService.splitIntoChunks(masterProductPrices, 100);

    await BluebirdPromise.each(splittedMasterProductPrices.toArray(), masterProductPriceChunks =>
      Promise.all(
        masterProductPriceChunks.map(masterProductPrice =>
          MasterProductPriceService.update(masterProductPrice.set('priceDetails', Map()).set('capturedDate', capturedDate)),
        ),
      ),
    );

    this.logInfo(config, () => 'Finished clearing old price details.');
  };

  syncToTagList = async (config) => {
    const finalConfig = config || (await CountdownService.getConfig());
    const existingTags = await CountdownService.getExistingTags();

    this.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown Products Price...');

    const crawlSessionInfos = await CrawlSessionService.search(
      Map({
        conditions: Map({
          sessionKey: 'Countdown Products',
        }),
        topMost: true,
      }),
    );

    const sessionInfo = crawlSessionInfos.first();
    const sessionId = sessionInfo.get('id');
    let tags = Set();

    this.logInfo(finalConfig, () => `Fetched the most recent Countdown crawling result for Countdown Products Price. Session Id: ${sessionId}`);

    const result = CrawlResultService.searchAll(
      Map({
        conditions: Map({
          crawlSessionId: sessionId,
        }),
      }),
    );

    try {
      result.event.subscribe(info => (tags = tags.add(info.getIn(['resultSet', 'productCategory']))));

      await result.promise;
    } finally {
      result.event.unsubscribeAll();
    }

    const newTags = tags.filterNot(tag => existingTags.find(_ => _.get('name').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0));

    await Promise.all(
      newTags
        .map(tag =>
          TagService.create(
            Map({
              name: tag,
              weight: 1,
            }),
          ),
        )
        .toArray(),
    );
  };

  syncMasterProductTags = async (config) => {
    const finalConfig = config || (await CountdownService.getConfig());
    const existingTags = await CountdownService.getExistingTags();

    this.logInfo(finalConfig, () => 'Fetching the most recent Countdown crawling result for Countdown Products Price...');

    const crawlSessionInfos = await CrawlSessionService.search(
      Map({
        conditions: Map({
          sessionKey: 'Countdown Products',
        }),
        topMost: true,
      }),
    );

    const sessionInfo = crawlSessionInfos.first();
    const sessionId = sessionInfo.get('id');
    let products = List();

    this.logInfo(finalConfig, () => `Fetched the most recent Countdown crawling result for Countdown Products Price. Session Id: ${sessionId}`);

    const result = CrawlResultService.searchAll(
      Map({
        conditions: Map({
          crawlSessionId: sessionId,
        }),
      }),
    );

    try {
      result.event.subscribe((info) => {
        const resultSet = info.get('resultSet');

        products = products.concat(
          resultSet
            .get('products')
            .filterNot(_ => _.get('description').trim().length === 0)
            .map(_ => _.set('productCategory', resultSet.get('productCategory'))),
        );
      });

      await result.promise;
    } finally {
      result.event.unsubscribeAll();
    }

    const productsGroupedByDescription = products.groupBy(_ => _.get('description'));

    this.logVerbose(finalConfig, () => 'Finding the product in master product...');

    const keys = productsGroupedByDescription.keySeq();

    if (keys.isEmpty()) {
      return;
    }

    const splittedKeys = CountdownService.splitIntoChunks(keys, 100);

    await BluebirdPromise.each(splittedKeys.toArray(), keyChunks =>
      Promise.all(keyChunks.map(key => CountdownService.updateProductTags(key, productsGroupedByDescription, existingTags))),
    );
  };

  logVerbose = (config, messageFunc) => {
    if (this.logVerboseFunc && config && config.get('logLevel') && config.get('logLevel') >= 3 && messageFunc) {
      this.logVerboseFunc(messageFunc());
    }
  };

  logInfo = (config, messageFunc) => {
    if (this.logInfoFunc && config && config.get('logLevel') && config.get('logLevel') >= 2 && messageFunc) {
      this.logInfoFunc(messageFunc());
    }
  };

  logError = (config, messageFunc) => {
    if (this.logErrorFunc && config && config.get('logLevel') && config.get('logLevel') >= 1 && messageFunc) {
      this.logErrorFunc(messageFunc());
    }
  };
}
