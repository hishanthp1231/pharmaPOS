const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VariantTypeSchema = new Schema({
  name: { type: String, required: true },
  branch_id: { type: Number, required: true },
  options: [{ type: Schema.Types.ObjectId, ref: 'VariantOption' }]
});

module.exports = mongoose.model('VariantType', VariantTypeSchema);
