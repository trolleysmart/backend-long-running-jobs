import fs from 'fs';
import path from 'path';
import {
  printSchema,
} from 'graphql';
import {
  getRootSchema,
} from '../src/endpoint/graphql/root-schema';

fs.writeFileSync(path.resolve(__dirname, '../data/schema.graphql'), printSchema(getRootSchema()));
