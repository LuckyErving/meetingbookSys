const { syncModels } = require('./models');

syncModels().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Model sync failed:', err);
  process.exit(1);
});
