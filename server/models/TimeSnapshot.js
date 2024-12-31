const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class TimeSnapshot extends Model {}

TimeSnapshot.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "Users",
      key: "id"
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  modalSplits: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isValidSplit(value) {
        const total = Object.values(value).reduce((sum, percent) => sum + percent, 0);
        if (Math.abs(total - 100) > 0.01) { // Allow for small floating point differences
          throw new Error("Modal splits must sum to 100%");
        }
      }
    }
  },
  questionnaire_responses: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  sequelize,
  modelName: "TimeSnapshot",
  timestamps: true
});

module.exports = TimeSnapshot;
