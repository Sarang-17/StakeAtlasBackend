const asyncHandler = require('../middlewares/async.middleware');

const filterHelper = asyncHandler(
  async ({
    model,
    populate,
    select,
    sort,
    page,
    limit,
    attributes,
    reqQuery,
  }) => {
    let query;
    // retrieving filter query in string form
    let queryString = JSON.stringify(reqQuery);

    // add $ sign to symbols
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Finding resource
    query = model.find(JSON.parse(queryString));

    if (populate) query = query.populate(populate);

    // select required fields
    if (select) {
      selections = select.split(',');
      query = query.select(selections);
    }

    if (attributes.length > 0) query.select(attributes);

    //  sort required fields
    if (sort) {
      const sortBy = sort.split(',').join('');
      query = query.sort(sortBy);
    } else {
      const sortBy = '-createdAt';
      query = query.sort(sortBy);
    }

    //## Pagination
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await model.countDocuments();
    query = query.skip(startIndex).limit(limit);

    const results = await query;

    //## Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    return {
      success: true,
      count: results.length,
      pagination,
      data: results,
    };
  }
);

module.exports = {
  filterHelper,
};
