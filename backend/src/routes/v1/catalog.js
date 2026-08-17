import { Router } from 'express';
import * as catalog from '../../controllers/catalogController.js';
import { validate } from '../../middleware/validate.js';
import {
  productListSchema,
  slugParamsSchema,
  idParamsSchema,
  suggestSchema,
  compareSchema,
} from '../../validators/product.js';

const products = Router();
products.get('/', validate(productListSchema), catalog.listProducts);
products.get('/:id/related', validate(idParamsSchema), catalog.related);
products.get('/:slug', validate(slugParamsSchema), catalog.getProduct);

const categories = Router();
categories.get('/', catalog.listCategories);
categories.get('/:slug', validate(slugParamsSchema), catalog.getCategory);

const search = Router();
search.get('/suggest', validate(suggestSchema), catalog.suggest);

const brands = Router();
brands.get('/', catalog.brands);

const compare = Router();
compare.get('/', validate(compareSchema), catalog.compare);

export { products, categories, search, brands, compare };
