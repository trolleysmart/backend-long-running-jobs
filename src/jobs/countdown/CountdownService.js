// @flow

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
    } else if (results.size === 1) {
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

    const highLevelProductCategories = crawlResults.first().getIn(['resultSet', 'highLevelProductCategories']);

    this.logInfo(finalConfig, () => 'Updating new Store Crawler config for Countdown...');

    const newConfig = currentConfig.setIn(['config', 'productCategories'], highLevelProductCategories);

    this.logVerbose(finalConfig, () => `New Store Crawler config for Countdown: ${JSON.stringify(newConfig)}`);

    await StoreCrawlerConfigurationService.create(newConfig);

    this.logInfo(finalConfig, () => 'Updated new Store Crawler config for Countdown...');
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

    this.logVerbose(finalConfig, () => 'Checking whether products already exist...');

    const results = await Promise.all(
      productsWithoutDuplication
        .map(product =>
          MasterProductService.exists(
            Map({
              conditions: product,
            }),
          ),
        )
        .toArray(),
    );

    this.logVerbose(finalConfig, () => 'Finished checking whether products already exist.');

    const indexes = Range(0, productsWithoutDuplication.size);
    const productsWithIndexes = productsWithoutDuplication.zipWith(
      (product, index) =>
        Map({
          product,
          index,
        }),
      indexes,
    );

    const newProducts = productsWithIndexes.filterNot(_ => results[_.get('index')]).map(_ => _.get('product'));

    if (newProducts.isEmpty()) {
      return;
    }

    this.logInfo(finalConfig, () => 'Saving new products...');

    const newProductInfo = newProducts.map(_ =>
      Map({
        description: _.get('description'),
        barcode: _.get('barcode'),
        imageUrl: _.get('imageUrl'),
      }),
    );

    await Promise.all(newProductInfo.map(MasterProductService.create).toArray());
  };

  syncToMasterProductPriceList = async (config) => {
    const finalConfig = config || (await CountdownService.getConfig());
    const stores = await CountdownService.getCountdownStore();

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

    this.logVerbose(finalConfig, () => 'Finding the product in master product...');

    const capturedDate = new Date();

    await Promise.all(
      productsWithoutDuplication
        .map(product => async () => {
          const results = await MasterProductService.search(
            Map({
              conditions: product,
            }),
          );
          if (results.isEmpty()) {
            throw new Exception(`No master product found for: ${JSON.stringify(product.toJS())}`);
          } else if (results.size > 1) {
            throw new Exception(`Multiple master products found for: ${JSON.stringify(product.toJS())}`);
          }

          const masterProduct = results.first();
          const masterProductPriceInfo = Map({
            masterProductId: masterProduct.get('id'),
            storeId: stores.find(_ => _.get('name').localeCompare('Countdown') === 0).get('id'),
            capturedDate,
            priceDetails: Map({
              specialType: CountdownService.getSpecialType(product),
              price: CountdownService.convertPriceStringToDecimal(CountdownService.getPrice(product)),
              wasPrice: CountdownService.convertPriceStringToDecimal(CountdownService.getWasPrice(product)),
              multiBuyInfo: CountdownService.getMultiBuyInfo(product),
            }),
          });

          await MasterProductPriceService.create(masterProductPriceInfo);
        })
        .toArray(),
    );
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

    await Promise.all(
      productsGroupedByDescription
        .keySeq()
        .map(key => async () => {
          const product = productsGroupedByDescription.get(key).first();
          const results = await MasterProductService.search(
            Map({
              conditions: product,
            }),
          );

          if (results.isEmpty()) {
            throw new Exception(`No master product found for: ${JSON.stringify(product.toJS())}`);
          } else if (results.size > 1) {
            throw new Exception(`Multiple master products found for: ${JSON.stringify(product.toJS())}`);
          }

          const existingProduct = results.first();
          const tags = productsGroupedByDescription.get(key).map(_ => _.get('productCategory')).toSet();
          const notFoundTags = tags.filterNot(tag =>
            existingTags.find(existingTag => existingTag.get('name').toLowerCase().trim().localeCompare(tag.toLowerCase().trim()) === 0),
          );

          if (!notFoundTags.isEmpty()) {
            throw new Exception(`Multiple master products found for: ${JSON.stringify(notFoundTags.toJS())}`);
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
        })
        .toArray(),
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
