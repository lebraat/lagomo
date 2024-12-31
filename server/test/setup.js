const { sequelize } = require("../models/User");

before(async () => {
  // Sync database in test mode
  await sequelize.sync({ force: true });
});

after(async () => {
  // Close database connection
  await sequelize.close();
});
