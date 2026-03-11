const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VariantOptionSchema = new Schema({
  name: { type: String, required: true },
  price_adjustment: { type: Number, default: 0 },
  variant_type: { type: Schema.Types.ObjectId, ref: 'VariantType', required: true },
  branch_id: { type: Number, required: true }
});

module.exports = mongoose.model('VariantOption', VariantOptionSchema);
