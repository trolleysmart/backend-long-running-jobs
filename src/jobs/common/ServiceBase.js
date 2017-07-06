// @flow

import { List, Map } from 'immutable';
import { ServiceBase as StoreCrawlerServiceBase } from 'store-crawler';
import { TagService } from 'smart-grocery-parse-server-common';

export default class ServiceBase extends StoreCrawlerServiceBase {
  getTags = async (weight) => {
    const result = TagService.searchAll(Map({ conditions: Map({ weight: weight || undefined }) }));

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
