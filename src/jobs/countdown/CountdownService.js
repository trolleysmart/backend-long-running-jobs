// @flow

import { ServiceBase } from '../common';

export default class CountdownService extends ServiceBase {
    syncTags = async (config) => {
    const finalConfig = config || (await this.getConfig('Job'));
    const store = await this.getStore('Countdown');
    const storeId = store.get('id');

    };
}
