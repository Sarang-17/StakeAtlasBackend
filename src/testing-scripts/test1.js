const assert = require('assert');
const mongoose = require('mongoose');
const { DB_USER, DB_PWD, DB_NAME } = require('../utils/config');

describe('Transaction tests', () => {
  let connection;
  const sampleData = { name: 'test', value: 123 };

  before(async () => {
    connection = await mongoose.connect(
      `mongodb+srv://${DB_USER}:${DB_PWD}@stakeatlas.dqyieos.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
  });

  after(async () => {
    await mongoose.disconnect();
  });

  it('Test successful transaction', async () => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let Test;
    try {
      Test = mongoose.model(
        'Test',
        new mongoose.Schema({
          name: String,
          value: Number,
        })
      );

      const test = new Test(sampleData);
      await test.save();

      // Perform additional operations here as part of the transaction

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    // Assert that the data was correctly saved to the database
    const savedTest = await Test.findOne(sampleData);
    assert(savedTest);
  });
});
