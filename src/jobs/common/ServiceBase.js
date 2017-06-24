// @flow

import Immutable, { List, Map, Range } from 'immutable';
import { ParseWrapperService, Exception } from 'micro-business-parse-server-common';
import { TagService, StoreTagService } from 'smart-grocery-parse-server-common';
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
}
