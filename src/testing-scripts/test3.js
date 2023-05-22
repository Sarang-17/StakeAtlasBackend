const mocha = require('mocha');
const assert = require('assert');
const mongoose = require('mongoose');
const { DB_USER, DB_PWD, DB_NAME } = require('../utils/config');

describe('Transaction tests', () => {
  let connection;
  const sampleData1 = { name: 'test1', value: 123 };
  const sampleData2 = { name: 'test2', value: 456 };

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

  it('Test nested transactions', async () => {
    const session = await mongoose.startSession();
    session.startTransaction();
    let Test1;
    let Test2;
    try {
      // Transaction 1
      Test1 = mongoose.model(
        'Test1',
        new mongoose.Schema({
          name: String,
          value: Number,
        })
      );

      const test1 = new Test1(sampleData1);
      await test1.save({ session });

      // Nested transaction
      const nestedSession = await mongoose.startSession();
      nestedSession.startTransaction();

      try {
        // Nested transaction operations
        Test2 = mongoose.model(
          'Test2',
          new mongoose.Schema({
            name: String,
            value: Number,
          })
        );

        const test2 = new Test2(sampleData2);
        await test2.save({ session: nestedSession });

        await nestedSession.commitTransaction();
      } catch (error) {
        await nestedSession.abortTransaction();
        throw error;
      } finally {
        nestedSession.endSession();
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    // Assert that both transactions were committed successfully
    const savedTest1 = await Test1.findOne(sampleData1);
    assert(savedTest1);
    const savedTest2 = await Test2.findOne(sampleData2);
    assert(savedTest2);
  });
});
