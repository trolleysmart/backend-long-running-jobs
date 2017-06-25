// @flow

import { List, Map } from 'immutable';
import { TagService } from 'smart-grocery-parse-server-common';
import { ServiceBase as StoreCrawlerServiceBase } from 'store-crawler';

export default class ServiceBase extends StoreCrawlerServiceBase {
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
