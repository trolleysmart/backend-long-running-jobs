// @flow

import { List, Map } from 'immutable';
import { ServiceBase as StoreCrawlerServiceBase } from 'trolley-smart-store-crawler';
import { MasterProductService, TagService } from 'trolley-smart-parse-server-common';

export default class ServiceBase extends StoreCrawlerServiceBase {
  getTags = async (weight, sessionToken) => {
    const result = TagService.searchAll(Map({ conditions: Map({ weight: weight || undefined }) }), sessionToken);

    try {
      let tags = List();

      result.event.subscribe((info) => {
        tags = tags.push(info);
      });

      await result.promise;

      return tags;
    } finally {
      result.event.unsubscribeAll();
    }
  };

  getMasterProducts = async ({ name, description, barcode, size }, sessionToken) => {
    const criteria = Map({
      conditions: Map({ name, description, barcode, size }),
    });

    return MasterProductService.search(criteria, sessionToken);
  };
}
