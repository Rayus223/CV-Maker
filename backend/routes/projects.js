const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

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
      return res.status(404).json({ msg: 'Project not found' });
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
    
    // Create new project
    const newProject = new Project({
      name: name || 'Untitled CV',
      description,
      data,
      thumbnail,
      user: req.user.id
    });
    
    const project = await newProject.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: projectFields },
      { new: true }
    );
    
    res.json(project);
  } catch (err) {
    console.error(err.message);
    
    // Check if ID format is valid
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE api/projects/:id
 * @desc    Delete a project
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
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
    await project.remove();
    
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    
    // Check if ID format is valid
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router; 