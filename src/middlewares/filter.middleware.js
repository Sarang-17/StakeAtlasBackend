const asyncHandler = require('./async.middleware');

const filterResults = (model, populate) =>
  asyncHandler(async (req, res, next) => {
    let query;
    // retrieving select query
    let { select, sort, page, limit } = req.query;

    // retrieving filter query in string form
    let queryString = JSON.stringify(req.query);

    // add $ sign to symbols
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`
    );

    // Finding resource
    query = model.find(JSON.parse(queryString));

    if (populate) {
      query = query.populate(populate);
    }

    // select required fields
    if (select) {
      const selections = select.split(',');
      query = query.select(selections);
    }
    //  sort required fields
    if (sort) {
      const sortBy = sort.split(',').join('');
      query = query.sort(sortBy);
    } else {
      const sortBy = '-createdAt';
      query = query.sort(sortBy);
    }

    // ## Pagination
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await model.countDocuments();
    query = query.skip(startIndex).limit(limit);

    const results = await query;

    // ## Pagination result
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

    res.advanceResult = {
      success: true,
      count: results.length,
      pagination,
      data: results,
    };
    next();
  });

module.exports = filterResults;
