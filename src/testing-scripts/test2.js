const mocha = require('mocha');
const assert = require('assert');
const mongoose = require('mongoose');
const { DB_USER, DB_PWD, DB_NAME } = require('../utils/config');

describe('Transaction tests', () => {
  let connection;
  const sampleData = { name: 'test2', value: 1234 };

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

  it('Test failed transaction', async () => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let Test;
    try {
      Test = mongoose.model(
        'Test2',
        new mongoose.Schema({
          name: String,
          value: Number,
        })
      );

      const test = new Test(sampleData);
      await test.save();

      // Perform a failing operation here as part of the transaction
      throw new Error('Failing operation');

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      // Assert that the transaction was rolled back
      const savedTest = await Test.findOne(sampleData);
      assert.strictEqual(savedTest, null);
    } finally {
      session.endSession();
    }
  });
});
