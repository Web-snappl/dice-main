const { createHash } = require('crypto');
const mongoose = require('mongoose');

const { BSON, MongoClient } = mongoose.mongo;

const sourceUri = process.env.SOURCE_MONGO_URI;
const targetUri = process.env.TARGET_MONGO_URI;

if (!sourceUri) {
  console.error('SOURCE_MONGO_URI environment variable is required');
  process.exit(1);
}

function safeError(error) {
  return {
    code: error?.code ?? null,
    name: error?.codeName || error?.name || 'Error',
    message: String(error?.message || error).replace(
      /mongodb(\+srv)?:\/\/[^@]+@/gi,
      'mongodb$1://[REDACTED]@',
    ),
  };
}

function normalizeIndex(index) {
  return {
    name: index.name,
    key: index.key,
    ...(index.unique ? { unique: true } : {}),
    ...(index.sparse ? { sparse: true } : {}),
    ...(index.expireAfterSeconds !== undefined
      ? { expireAfterSeconds: index.expireAfterSeconds }
      : {}),
    ...(index.partialFilterExpression
      ? { partialFilterExpression: index.partialFilterExpression }
      : {}),
    ...(index.collation ? { collation: index.collation } : {}),
  };
}

async function canonicalHash(collection) {
  const hash = createHash('sha256');
  const cursor = collection.find({}).sort({ _id: 1 }).batchSize(250);

  for await (const document of cursor) {
    hash.update(BSON.EJSON.stringify(document, null, 0, { relaxed: false }));
    hash.update('\n');
  }

  return hash.digest('hex');
}

async function commandOrError(db, command) {
  try {
    return await db.command(command);
  } catch (error) {
    return { unavailable: safeError(error) };
  }
}

async function financialSnapshot(db) {
  const collectionNames = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map(
      (collection) => collection.name,
    ),
  );

  const result = {};

  if (collectionNames.has('users')) {
    const [balances] = await db
      .collection('users')
      .aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalBalance: { $sum: { $ifNull: ['$balance', 0] } },
            negativeBalances: {
              $sum: {
                $cond: [{ $lt: [{ $ifNull: ['$balance', 0] }, 0] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray();
    result.users = balances || {
      count: 0,
      totalBalance: 0,
      negativeBalances: 0,
    };
    delete result.users._id;
  }

  if (collectionNames.has('transactions')) {
    result.transactions = await db
      .collection('transactions')
      .aggregate([
        {
          $group: {
            _id: {
              type: { $ifNull: ['$type', null] },
              method: { $ifNull: ['$method', null] },
              status: { $ifNull: ['$status', null] },
            },
            count: { $sum: 1 },
            totalAmount: { $sum: { $ifNull: ['$amount', 0] } },
          },
        },
        { $sort: { '_id.type': 1, '_id.method': 1, '_id.status': 1 } },
      ])
      .toArray();

    const duplicateGroups = async (field) => {
      const [summary] = await db
        .collection('transactions')
        .aggregate([
          { $match: { [field]: { $exists: true, $nin: [null, ''] } } },
          { $group: { _id: `$${field}`, count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } },
          {
            $group: {
              _id: null,
              groups: { $sum: 1 },
              documents: { $sum: '$count' },
              maximumMultiplicity: { $max: '$count' },
            },
          },
        ])
        .toArray();
      if (!summary) return { groups: 0, documents: 0, maximumMultiplicity: 0 };
      delete summary._id;
      return summary;
    };

    result.duplicateReferences = {
      referenceId: await duplicateGroups('referenceId'),
      providerTransactionId: await duplicateGroups('providerTransactionId'),
    };
  }

  return result;
}

async function snapshot(uri, label) {
  const client = new MongoClient(uri, {
    appName: 'dice-migration-audit',
    connectTimeoutMS: 20000,
    serverSelectionTimeoutMS: 20000,
  });

  try {
    await client.connect();
    const db = client.db();
    const hello = await db.admin().command({ hello: 1 });
    const databaseStats = await commandOrError(db, { dbStats: 1, scale: 1 });
    const definitions = await db
      .listCollections({}, { nameOnly: false })
      .toArray();
    const collections = [];

    for (const definition of definitions
      .filter((collection) => !collection.name.startsWith('system.'))
      .sort((left, right) => left.name.localeCompare(right.name))) {
      const collection = db.collection(definition.name);
      const [count, indexes, hash, stats] = await Promise.all([
        collection.countDocuments({}),
        collection.listIndexes().toArray(),
        canonicalHash(collection),
        commandOrError(db, { collStats: definition.name, scale: 1 }),
      ]);

      collections.push({
        name: definition.name,
        type: definition.type,
        options: definition.options || {},
        count,
        canonicalSha256: hash,
        indexes: indexes.map(normalizeIndex),
        storage: stats.unavailable
          ? stats
          : {
              size: stats.size,
              storageSize: stats.storageSize,
              totalIndexSize: stats.totalIndexSize,
            },
      });
    }

    return {
      label,
      database: db.databaseName,
      topology: {
        setName: hello.setName || null,
        isWritablePrimary: Boolean(hello.isWritablePrimary),
        maxWireVersion: hello.maxWireVersion,
      },
      databaseStats: databaseStats.unavailable
        ? databaseStats
        : {
            collections: databaseStats.collections,
            objects: databaseStats.objects,
            dataSize: databaseStats.dataSize,
            storageSize: databaseStats.storageSize,
            indexSize: databaseStats.indexSize,
            totalSize: databaseStats.totalSize,
          },
      financial: await financialSnapshot(db),
      collections,
    };
  } finally {
    await client.close();
  }
}

function comparable(snapshotValue) {
  return {
    database: snapshotValue.database,
    financial: snapshotValue.financial,
    collections: snapshotValue.collections.map((collection) => ({
      name: collection.name,
      type: collection.type,
      options: collection.options,
      count: collection.count,
      canonicalSha256: collection.canonicalSha256,
      indexes: collection.indexes,
    })),
  };
}

async function main() {
  const source = await snapshot(sourceUri, 'source');
  const output = { generatedAt: new Date().toISOString(), source };

  if (targetUri) {
    const target = await snapshot(targetUri, 'target');
    const sourceComparable = comparable(source);
    const targetComparable = comparable(target);
    const matches =
      BSON.EJSON.stringify(sourceComparable, null, 0, { relaxed: false }) ===
      BSON.EJSON.stringify(targetComparable, null, 0, { relaxed: false });
    output.target = target;
    output.integrityMatch = matches;
    if (!matches) process.exitCode = 2;
  }

  console.log(BSON.EJSON.stringify(output, null, 2, { relaxed: false }));
}

main().catch((error) => {
  console.error(JSON.stringify({ error: safeError(error) }, null, 2));
  process.exit(1);
});
