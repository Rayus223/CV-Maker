const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Define a Project model schema using mongoose
const Project = require('../models/Project');

/**
 * @route   GET api/projects
 * @desc    Get all projects for the current user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET api/projects/:id
 * @desc    Get a specific project by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if ID is valid
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ msg: 'Invalid project ID provided' });
    }

    const project = await Project.findById(req.params.id);
    
    // Check if project exists
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    // Check if user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    
    // Check if ID format is valid
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found - invalid ID format' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST api/projects
 * @desc    Create a new CV project
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, data, thumbnail } = req.body;
    
    console.log('Creating new project with thumbnail:', JSON.stringify(thumbnail));
    
    // Validate thumbnail if provided
    if (thumbnail && typeof thumbnail === 'object') {
      if (!thumbnail.url) {
        thumbnail.url = '';
      }
      if (!thumbnail.publicId) {
        thumbnail.publicId = '';
      }
    }
    
    // Create new project
    const newProject = new Project({
      name: name || 'Untitled CV',
      description,
      data,
      thumbnail,
      user: req.user.id
    });
    
    const project = await newProject.save();
    console.log(`New project created with ID: ${project._id}`);
    res.json(project);
  } catch (err) {
    console.error('Error creating project:', err.message);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

/**
 * @route   PUT api/projects/:id
 * @desc    Update an existing project
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, data, thumbnail } = req.body;
    
    console.log(`Updating project ${req.params.id}`);
    console.log('With thumbnail:', JSON.stringify(thumbnail));

    // Validate thumbnail if provided
    if (thumbnail && typeof thumbnail === 'object') {
      if (!thumbnail.url) {
        thumbnail.url = '';
      }
      if (!thumbnail.publicId) {
        thumbnail.publicId = '';
      }
    }

    // Check if ID is valid
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ 
        msg: 'Invalid project ID provided. Use POST to create a new project instead.' 
      });
    }

    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        msg: 'Invalid project ID format. Must be a valid MongoDB ObjectId.' 
      });
    }
    
    // Log size of the data being saved
    if (data) {
      const dataSize = JSON.stringify(data).length;
      console.log(`Project data size: ${dataSize} bytes`);
      
      if (data.customTextElements) {
        console.log(`Project contains ${Object.keys(data.customTextElements).length} custom text elements`);
      }
      
      if (data.elementStyles && data.elementStyles.length) {
        console.log(`Project contains ${data.elementStyles.length} element styles`);
      }
    }
    
    // Find the project
    let project = await Project.findById(req.params.id);
    
    // Check if project exists
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    // Check if user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Create project object with updated fields
    const projectFields = {};
    if (name) projectFields.name = name;
    if (description !== undefined) projectFields.description = description;
    if (data) projectFields.data = data;
    if (thumbnail) projectFields.thumbnail = thumbnail;
    
    // Update the project
    try {
      project = await Project.findByIdAndUpdate(
        req.params.id,
        { $set: projectFields },
        { new: true }
      );
      
      console.log(`Project ${req.params.id} updated successfully`);
      res.json(project);
    } catch (updateError) {
      console.error('Error updating project:', updateError);
      return res.status(500).json({ 
        msg: 'Error updating project', 
        error: updateError.message, 
        stack: updateError.stack
      });
    }
  } catch (err) {
    console.error('Error in update route:', err);
    
    // Check if ID format is valid
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found - invalid ID format' });
    }
    
    res.status(500).json({
      msg: 'Server Error in update route',
      error: err.message,
      stack: err.stack
    });
  }
});

/**
 * @route   DELETE api/projects/:id
 * @desc    Delete a project
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if ID is valid
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ msg: 'Invalid project ID provided' });
    }

    // Find the project
    const project = await Project.findById(req.params.id);
    
    // Check if project exists
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    // Check if user owns the project
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Delete the project
    await project.deleteOne();
    
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    
    // Check if ID format is valid
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found - invalid ID format' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router; 