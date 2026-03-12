const express = require('express');
const router = express.Router();
const { processDocuments, generateScenarios } = require('../services/abm-processor');
const { generateConversation, refreshConversations } = require('../services/abm-conversation');
const { exportFramework } = require('../services/abm-export');

// Validate documents helper
const validateDocuments = (productProposal, userPersona, agentFramework) => {
  if (!productProposal || !userPersona || !agentFramework) {
    return 'All three documents (Product Proposal, User Persona, Agent Framework) are required.';
  }
  const hasContent = (doc) => {
    if (!doc || !doc.type) return false;
    if (doc.type === 'text' || doc.type === 'file') return !!(doc.content && doc.content.trim());
    if (doc.type === 'url') return !!(doc.url && doc.url.trim());
    return false;
  };
  if (!hasContent(productProposal) || !hasContent(userPersona) || !hasContent(agentFramework)) {
    return 'All three documents must have content. Please check that your files were uploaded correctly.';
  }
  return null;
};

// Step 1: Extract key info from documents (single Bedrock call, ~15-25s)
// Split from scenario generation to stay under API Gateway 29s timeout
router.post('/process-documents', async (req, res) => {
  try {
    const { productProposal, userPersona, agentFramework } = req.body;
    const err = validateDocuments(productProposal, userPersona, agentFramework);
    if (err) return res.status(400).json({ error: err });

    console.log('Extracting from ABM documents...');
    const processedDocs = await processDocuments({
      productProposal,
      userPersona,
      agentFramework
    });

    res.json({
      success: true,
      processedData: processedDocs,
      suggestedControls: processedDocs.suggestedControls || null
    });
  } catch (error) {
    console.error('Error processing documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Step 2: Generate scenarios from extracted data (single Bedrock call, ~10-20s)
// Separate call keeps each request under API Gateway 29s limit
router.post('/generate-scenarios', async (req, res) => {
  try {
    const { processedData } = req.body;
    if (!processedData || !processedData.product || !processedData.persona || !processedData.agent) {
      return res.status(400).json({ error: 'processedData with product, persona, and agent is required.' });
    }

    console.log('Generating ABM scenarios...');
    const scenarios = await generateScenarios(processedData);

    res.json({
      success: true,
      scenarios
    });
  } catch (error) {
    console.error('Error generating scenarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate conversation for a selected scenario
router.post('/generate-conversation', async (req, res) => {
  try {
    const { scenario, processedData, agentControls } = req.body;
    
    console.log(`Generating conversation for scenario:`, scenario?.title || scenario?.id);
    
    const conversation = await generateConversation({
      scenario,
      processedData,
      agentControls
    });
    
    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error generating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle user interruption/custom scenario
router.post('/user-interrupt', async (req, res) => {
  try {
    const { input, currentConversation, processedData, agentControls } = req.body;
    
    console.log('Processing user interruption...');
    
    // Generate response to user's custom scenario
    const updatedConversation = await generateConversation({
      userInput: input,
      existingConversation: currentConversation,
      processedData,
      agentControls
    });
    
    res.json({
      success: true,
      conversation: updatedConversation
    });
  } catch (error) {
    console.error('Error processing user input:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refresh conversations with new agent controls
router.post('/refresh-conversations', async (req, res) => {
  try {
    const { processedData, agentControls, existingConversations } = req.body;
    
    console.log('Refreshing conversations with new controls...');
    
    const conversations = await refreshConversations({
      processedData,
      agentControls,
      existingConversations
    });
    
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error refreshing conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export updated agent framework
router.post('/export-framework', async (req, res) => {
  try {
    const { processedData, agentControls, conversations } = req.body;
    
    console.log('Exporting updated framework...');
    
    const zipStream = await exportFramework({
      processedData,
      agentControls,
      conversations
    });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="agent-persona-export.zip"');
    zipStream.pipe(res);
  } catch (error) {
    console.error('Error exporting framework:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
