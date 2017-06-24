// @flow

import { ServiceBase } from '../common';

export default class WarehouseService extends ServiceBase {
  syncProductCategoriesToStoreTags = async () => {
    const crawlResults = await this.getMostRecentCrawlResults('Warehouse Product Categories', info =>
      info.getIn(['resultSet', 'highLevelProductCategories']),
    );
    const productCategories = crawlResults.first();
  };
}
