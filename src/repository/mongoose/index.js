// * Helper Imports
const JsonHelper = require('../../helpers/json');

const create = async ({ modelName, createObject, t }, logger) => {
  try {
    const createdObject = t
      ? await modelName.create([createObject], {
          session: t,
        })
      : await modelName.create(createObject);

    return { data: createdObject, error: '' };
  } catch (err) {
    if (err?.errors?.[0]?.message) {
      const msg = err.errors[0].message;
      // TODO: read/unread - change it
      // temporarily shut down logs for this - will be handled when read/unread is implemented
      logger.error(`Error while creating ${modelName}: ${msg}`);
      return { data: '', error: msg };
    }
    // temporarily shut down logs for this - will be handled when read/unread is implemented
    // logger.error(`Error while creating ${modelName}: `, err);
    return { data: '', error: err.message };
  }
};

const fetchOne = async (
  { modelName, query, include = [], extras, t },
  logger
) => {
  try {
    let modelQuery = t
      ? modelName.findOne(query).populate(include).session(t)
      : modelName.findOne(query).populate(include);

    if (extras && extras.select) {
      const selections = extras.select.split(',');
      modelQuery = modelQuery.select(selections);
    }

    if (extras && extras.attributes) modelQuery.select(extras.attributes);

    if (extras && extras.sort) {
      const sortBy = extras.sort.split(',').join('');
      modelQuery = modelQuery.sort(sortBy);
    } else {
      const sortBy = '-createdAt';
      modelQuery = modelQuery.sort(sortBy);
    }

    const data = await modelQuery;
    return { data, error: '' };
  } catch (err) {
    logger.error(`Error while fetching ${modelName}: `, err);
    return { data: '', error: err.message };
  }
};

const fetchById = async (
  { modelName, query, include = [], extras, t },
  logger
) => {
  try {
    let modelQuery = t
      ? modelName.findById(query.id).populate(include).session(t)
      : modelName.findById(query.id).populate(include);

    if (extras && extras.select) {
      const selections = extras.select.split(',');
      modelQuery = modelQuery.select(selections);
    }

    if (extras && extras.attributes) modelQuery.select(extras.attributes);

    if (extras && extras.sort) {
      const sortBy = extras.sort.split(',').join('');
      modelQuery = modelQuery.sort(sortBy);
    } else {
      const sortBy = '-createdAt';
      modelQuery = modelQuery.sort(sortBy);
    }

    const data = await modelQuery;

    return { data, error: '' };
  } catch (err) {
    logger.error(`Error while fetching ${modelName}: `, err);
    return { data: '', error: err.message };
  }
};

const fetchAll = async (
  { modelName, query, include = [], extras, t },
  logger
) => {
  try {
    let modelQuery = t
      ? modelName.find(query).populate(include).session(t)
      : modelName.find(query).populate(include);

    if (extras && extras.select) {
      const selections = extras.select.split(',');
      modelQuery = modelQuery.select(selections);
    }

    if (extras && extras.attributes) modelQuery.select(extras.attributes);

    if (extras && extras.sort) {
      const sortBy = extras.sort.split(',').join('');
      modelQuery = modelQuery.sort(sortBy);
    } else {
      const sortBy = '-createdAt';
      modelQuery = modelQuery.sort(sortBy);
    }

    if (!extras.page) extras.page = 1;
    if (!extras.limit) extras.limit = 10;
    const startIndex = (extras.page - 1) * extras.limit;
    const endIndex = extras.page * extras.limit;
    const total = await modelName.countDocuments();

    modelQuery = modelQuery.skip(startIndex).limit(extras.limit);

    // ## Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: extras.page + 1,
        limit: extras.limit,
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: extras.page - 1,
        limit: extras.limit,
      };
    }

    const data = await modelQuery;
    data.pagination = pagination;

    return { data, error: '' };
  } catch (err) {
    logger.error(`Error while fetching ${modelName}(All): `, err);
    return { data: '', error: err.message };
  }
};

const update = async (
  { modelName, updateObject, query, extras, t },
  logger
) => {
  try {
    const data = t
      ? await modelName
          .findByIdAndUpdate(query.id, updateObject, extras)
          .session(t)
      : await modelName.findByIdAndUpdate(query.id, updateObject, extras);
    return { data, error: '' };
  } catch (err) {
    logger.error(`Error while updating ${modelName}: `, err);
    return { data: '', error: err.message };
  }
};

const destroy = async ({ modelName, query, t }, logger) => {
  try {
    const data = await modelName
      .findByIdAndDelete(query.id)
      .session(t)
      .clone()
      .catch(function (err) {
        logger.error(`Error while deleting ${modelName}: `, err);
        return { data: '', error: err.message };
      });
    return { data: JsonHelper.parse(data), error: '' };
  } catch (err) {
    logger.error(`Error while deleting ${modelName}: `, err);
    return { data: '', error: err.message };
  }
};

const updateOne = async ({ modelName, query, updateObject, t }, logger) => {
  try {
    const data = t
      ? await modelName.updateOne(query, updateObject).session(t)
      : await modelName.updateOne(query, updateObject);
    return { data, error: '' };
  } catch (err) {
    logger.error(`Error while updating ${modelName}: `, err);
    return { data: '', error: err.message };
  }
};

const Repository = {
  create,
  fetchOne,
  fetchById,
  fetchAll,
  update,
  destroy,
  updateOne,
};

module.exports = Repository;
