const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Modal extends Model {}

Modal.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: "Modal",
  timestamps: true
});

module.exports = Modal;
