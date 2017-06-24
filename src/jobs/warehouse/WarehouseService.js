// @flow

import { ServiceBase } from '../common';

export default class WarehouseService extends ServiceBase {
  syncProductCategoriesToStoreTags = async () => {
    const store = await this.getStore('Warehouse');
    const productCategories = (await this.getMostRecentCrawlResults('Warehouse Product Categories', info =>
      info.getIn(['resultSet', 'productCategories']),
    )).first();
  };
}
