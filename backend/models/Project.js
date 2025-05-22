const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define a schema for CV Projects
const ProjectSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Untitled CV'
  },
  description: {
    type: String,
    default: ''
  },
  data: {
    type: Object,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the 'updatedAt' field on save
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('project', ProjectSchema); 