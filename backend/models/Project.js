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
    required: true,
    // Make sure there's no size limitation or validation that could be truncating the data
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
}, {
  // Add these options to ensure large objects can be handled
  // This enables handling larger documents
  bufferCommands: false,
  // Add useNestedStrict to handle nested objects properly
  strict: false
});

// Update the 'updatedAt' field on save
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add middleware to log the size of data before saving
ProjectSchema.pre('save', function(next) {
  try {
    const dataSize = JSON.stringify(this.data).length;
    console.log(`Saving project ${this._id} - data size: ${dataSize} bytes`);
    
    if (this.data.customTextElements) {
      console.log(`Project contains ${Object.keys(this.data.customTextElements).length} custom text elements`);
    }
    
    if (this.data.elementStyles) {
      console.log(`Project contains ${this.data.elementStyles.length} element styles`);
    }
  } catch (error) {
    console.error('Error logging project data size:', error);
  }
  
  next();
});

module.exports = mongoose.model('project', ProjectSchema); 