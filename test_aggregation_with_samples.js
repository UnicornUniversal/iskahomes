/**
 * Diagnostic Script: Test Cron Aggregation Logic Against PostHog Sample Events
 * 
 * This script simulates how the cron job extracts and aggregates properties from PostHog events.
 * It uses the exported CSV samples to identify mismatches between what PostHog has and what the cron processes.
 * 
 * Usage: node test_aggregation_with_samples.js
 */

const fs = require('fs');
const path = require('path');

// Simulate the cron's property extraction logic
function extractProperties(event, allPropertiesJson) {
  // The cron accesses event.properties directly
  // But in the CSV, properties are in the all_properties JSON column
  const properties = typeof allPropertiesJson === 'string' 
    ? JSON.parse(allPropertiesJson) 
    : allPropertiesJson || {};
  
  // Simulate cron's extraction logic (from route.js lines 225-244)
  const listingId = properties.listing_id || properties.listingId || properties.listing_uuid || properties.property_id;
  let listerId = properties.lister_id || properties.listerId || properties.developer_id || properties.developerId || properties.agent_id || properties.agentId;
  let listerType = properties.lister_type || properties.listerType || 
    (properties.developer_id || properties.developerId ? 'developer' : null) || 
    (properties.agent_id || properties.agentId ? 'agent' : null);
  
  const seekerIdFromProps = properties.seeker_id || properties.seekerId;
  const seekerId = seekerIdFromProps || (event.distinct_id ? event.distinct_id : 'anonymous');
  
  const isLoggedIn = properties.is_logged_in === true || properties.is_logged_in === 'true' || 
    properties.isLoggedIn === true || properties.isLoggedIn === 'true';
  const viewedFrom = properties.viewed_from || properties.viewedFrom;
  const profileId = properties.profile_id || properties.profileId;
  const developmentId = properties.development_id || properties.developmentId;
  
  return {
    listingId,
    listerId,
    listerType,
    seekerId,
    isLoggedIn,
    viewedFrom,
    profileId,
    developmentId,
    // Raw properties for debugging
    rawProperties: properties
  };
}

// Parse CSV line (simple parser - handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Read and parse CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || null;
      });
      rows.push(row);
    }
  }
  
  return { headers, rows };
}

// Group events by event type
function groupByEventType(rows) {
  const grouped = {};
  
  rows.forEach(row => {
    const eventType = row.event;
    if (!grouped[eventType]) {
      grouped[eventType] = [];
    }
    grouped[eventType].push(row);
  });
  
  return grouped;
}

// Analyze extraction results
function analyzeExtraction(eventType, events) {
  const results = {
    eventType,
    totalEvents: events.length,
    extractionResults: [],
    issues: {
      missingListingId: 0,
      missingListerId: 0,
      missingSeekerId: 0,
      missingDevelopmentId: 0,
      nullListerId: 0,
      nullListingId: 0
    },
    propertyVariations: {
      listingId: new Set(),
      listerId: new Set(),
      seekerId: new Set(),
      developmentId: new Set()
    }
  };
  
  events.forEach((event, idx) => {
    try {
      const extracted = extractProperties(event, event.all_properties);
      results.extractionResults.push({
        index: idx,
        timestamp: event.timestamp,
        extracted,
        // Also check CSV columns (flattened)
        csvColumns: {
          listing_id: event.listing_id,
          listingId: event.listingId,
          lister_id: event.lister_id,
          listerId: event.listerId,
          developer_id: event.developer_id,
          developerId: event.developerId,
          seeker_id: event.seeker_id,
          seekerId: event.seekerId,
          development_id: event.development_id,
          developmentId: event.developmentId
        }
      });
      
      // Track issues
      if (!extracted.listingId && (event.listing_id || event.listingId)) {
        results.issues.missingListingId++;
      }
      if (!extracted.listerId && (event.lister_id || event.listerId || event.developer_id || event.developerId)) {
        results.issues.missingListerId++;
      }
      if (!extracted.seekerId || extracted.seekerId === 'anonymous') {
        if (event.seeker_id || event.seekerId || event.distinct_id) {
          results.issues.missingSeekerId++;
        }
      }
      if (!extracted.developmentId && (event.development_id || event.developmentId)) {
        results.issues.missingDevelopmentId++;
      }
      if (extracted.listerId === null || extracted.listerId === 'null') {
        results.issues.nullListerId++;
      }
      if (extracted.listingId === null || extracted.listingId === 'null') {
        results.issues.nullListingId++;
      }
      
      // Track property name variations found
      if (extracted.rawProperties.listing_id) results.propertyVariations.listingId.add('listing_id');
      if (extracted.rawProperties.listingId) results.propertyVariations.listingId.add('listingId');
      if (extracted.rawProperties.lister_id) results.propertyVariations.listerId.add('lister_id');
      if (extracted.rawProperties.listerId) results.propertyVariations.listerId.add('listerId');
      if (extracted.rawProperties.developer_id) results.propertyVariations.listerId.add('developer_id');
      if (extracted.rawProperties.developerId) results.propertyVariations.listerId.add('developerId');
      if (extracted.rawProperties.seeker_id) results.propertyVariations.seekerId.add('seeker_id');
      if (extracted.rawProperties.seekerId) results.propertyVariations.seekerId.add('seekerId');
      if (extracted.rawProperties.development_id) results.propertyVariations.developmentId.add('development_id');
      if (extracted.rawProperties.developmentId) results.propertyVariations.developmentId.add('developmentId');
      
    } catch (error) {
      console.error(`Error processing event ${idx} of type ${eventType}:`, error.message);
    }
  });
  
  // Convert Sets to Arrays for JSON output
  results.propertyVariations = {
    listingId: Array.from(results.propertyVariations.listingId),
    listerId: Array.from(results.propertyVariations.listerId),
    seekerId: Array.from(results.propertyVariations.seekerId),
    developmentId: Array.from(results.propertyVariations.developmentId)
  };
  
  return results;
}

// Main analysis function
function analyzeCSVFiles() {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(__dirname, '..', 'Downloads', 'export (1).csv'),
    path.join(__dirname, '..', 'Downloads', 'export (2).csv'),
    path.join('C:', 'Users', 'HP GAMING', 'Downloads', 'export (1).csv'),
    path.join('C:', 'Users', 'HP GAMING', 'Downloads', 'export (2).csv'),
    path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads', 'export (1).csv'),
    path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads', 'export (2).csv')
  ];
  
  const csvFiles = possiblePaths.filter(p => fs.existsSync(p));
  
  if (csvFiles.length === 0) {
    console.error('❌ No CSV files found. Please ensure the exported CSV files are in your Downloads folder.');
    console.error('   Expected files: export (1).csv, export (2).csv');
    return {};
  }
  
  const allResults = {};
  
  csvFiles.forEach((filePath, fileIdx) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    console.log(`\n📄 Processing file ${fileIdx + 1}: ${path.basename(filePath)}`);
    const { headers, rows } = parseCSV(filePath);
    console.log(`   Found ${rows.length} events with ${headers.length} columns`);
    
    const grouped = groupByEventType(rows);
    console.log(`   Event types: ${Object.keys(grouped).join(', ')}`);
    
    // Analyze each event type (limit to 5 samples per type for readability)
    Object.keys(grouped).forEach(eventType => {
      const events = grouped[eventType];
      const sampleSize = Math.min(5, events.length);
      const sampleEvents = events.slice(0, sampleSize);
      
      console.log(`\n   📊 Analyzing ${eventType} (${events.length} total, showing ${sampleSize} samples)`);
      
      const analysis = analyzeExtraction(eventType, sampleEvents);
      
      // Store results
      if (!allResults[eventType]) {
        allResults[eventType] = {
          totalInAllFiles: 0,
          analyses: []
        };
      }
      allResults[eventType].totalInAllFiles += events.length;
      allResults[eventType].analyses.push(analysis);
      
      // Print summary
      console.log(`      Issues found:`);
      Object.entries(analysis.issues).forEach(([issue, count]) => {
        if (count > 0) {
          console.log(`         ⚠️  ${issue}: ${count} events`);
        }
      });
      
      console.log(`      Property variations found:`);
      Object.entries(analysis.propertyVariations).forEach(([prop, variations]) => {
        if (variations.length > 0) {
          console.log(`         ${prop}: ${variations.join(', ')}`);
        }
      });
      
      // Show sample extraction results
      console.log(`      Sample extractions (first ${Math.min(3, sampleSize)}):`);
      analysis.extractionResults.slice(0, 3).forEach((result, idx) => {
        console.log(`         Sample ${idx + 1}:`);
        console.log(`            Listing ID: ${result.extracted.listingId || 'MISSING'} (CSV: ${result.csvColumns.listing_id || result.csvColumns.listingId || 'N/A'})`);
        console.log(`            Lister ID: ${result.extracted.listerId || 'MISSING'} (CSV: ${result.csvColumns.lister_id || result.csvColumns.listerId || result.csvColumns.developer_id || result.csvColumns.developerId || 'N/A'})`);
        console.log(`            Seeker ID: ${result.extracted.seekerId || 'MISSING'} (CSV: ${result.csvColumns.seeker_id || result.csvColumns.seekerId || 'N/A'})`);
        if (eventType === 'development_view') {
          console.log(`            Development ID: ${result.extracted.developmentId || 'MISSING'} (CSV: ${result.csvColumns.development_id || result.csvColumns.developmentId || 'N/A'})`);
        }
      });
    });
  });
  
  // Generate summary report
  console.log(`\n\n📋 SUMMARY REPORT`);
  console.log(`================`);
  
  Object.keys(allResults).forEach(eventType => {
    const eventData = allResults[eventType];
    console.log(`\n${eventType}:`);
    console.log(`   Total events across all files: ${eventData.totalInAllFiles}`);
    
    // Aggregate issues across all analyses
    const totalIssues = {
      missingListingId: 0,
      missingListerId: 0,
      missingSeekerId: 0,
      missingDevelopmentId: 0,
      nullListerId: 0,
      nullListingId: 0
    };
    
    eventData.analyses.forEach(analysis => {
      Object.keys(totalIssues).forEach(issue => {
        totalIssues[issue] += analysis.issues[issue];
      });
    });
    
    const hasIssues = Object.values(totalIssues).some(count => count > 0);
    if (hasIssues) {
      console.log(`   ⚠️  Issues:`);
      Object.entries(totalIssues).forEach(([issue, count]) => {
        if (count > 0) {
          console.log(`      ${issue}: ${count} events`);
        }
      });
    } else {
      console.log(`   ✅ No issues detected`);
    }
  });
  
  // Save detailed results to JSON
  const outputPath = path.join(__dirname, 'aggregation_analysis_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\n💾 Detailed results saved to: ${outputPath}`);
  
  return allResults;
}

// Run analysis
if (require.main === module) {
  try {
    analyzeCSVFiles();
  } catch (error) {
    console.error('❌ Error running analysis:', error);
    process.exit(1);
  }
}

module.exports = { analyzeCSVFiles, extractProperties, analyzeExtraction };

