// @flow

import Immutable, { List, Map, Range } from 'immutable';
import { ParseWrapperService, Exception } from 'micro-business-parse-server-common';
import { CrawlResultService, CrawlSessionService, StoreService, TagService, StoreTagService } from 'smart-grocery-parse-server-common';
import { ServiceBase as StoreCrawlerServiceBase } from 'store-crawler';

export default class ServiceBase extends StoreCrawlerServiceBase {
  splitIntoChunks = (list, chunkSize) => Range(0, list.count(), chunkSize).map(chunkStart => list.slice(chunkStart, chunkStart + chunkSize));

  getJobConfig = async () => {
    const config = await ParseWrapperService.getConfig();
    const jobConfig = config.get('Job');

    if (jobConfig) {
      return Immutable.fromJS(jobConfig);
    }

    throw new Exception('No config found called Job.');
  };

  getStore = async (name) => {
    const criteria = Map({
      conditions: Map({
        name,
      }),
    });

    const results = await StoreService.search(criteria);

    if (results.isEmpty()) {
      return StoreService.read(await StoreService.create(Map({ name })));
    } else if (results.count() === 1) {
      return results.first();
    }
    throw new Exception(`Multiple store found called ${name}.`);
  };

  getExistingStoreTags = async (storeId) => {
    const result = StoreTagService.searchAll(Map({ conditions: Map({ storeId }) }));

    try {
      let storeTags = List();

      result.event.subscribe(info => (storeTags = storeTags.push(info)));

      await result.promise;

      return storeTags;
    } finally {
      result.event.unsubscribeAll();
    }
  };

  getExistingTags = async () => {
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

  getMostRecentCrawlSessionInfo = async (sessionKey) => {
    const crawlSessionInfos = await CrawlSessionService.search(
      Map({
        conditions: Map({
          sessionKey,
        }),
        topMost: true,
      }),
    );

    return crawlSessionInfos.first();
  };

  getMostRecentCrawlResults = async (sessionKey, mapFunc) => {
    const crawlSessionInfo = await this.getMostRecentCrawlSessionInfo(sessionKey);
    const crawlSessionId = crawlSessionInfo.get('id');
    let results = List();

    const result = CrawlResultService.searchAll(
      Map({
        conditions: Map({
          crawlSessionId,
        }),
      }),
    );

    try {
      result.event.subscribe(info => (results = results.concat(mapFunc ? mapFunc(info) : info)));

      await result.promise;
    } finally {
      result.event.unsubscribeAll();
    }

    return results;
  };
}
