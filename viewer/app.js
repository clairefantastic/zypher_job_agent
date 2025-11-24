// DOM Elements
const inputSection = document.getElementById('inputSection');
const progressSection = document.getElementById('progressSection');
const resultsSection = document.getElementById('resultsSection');
const analyzeBtn = document.getElementById('analyzeBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const downloadBtn = document.getElementById('downloadBtn');
const jobUrlInput = document.getElementById('jobUrl');
const resumeInput = document.getElementById('resume');
const linkedinInput = document.getElementById('linkedin');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const reportContent = document.getElementById('reportContent');

// State
let currentReport = '';

// Event Listeners
analyzeBtn.addEventListener('click', startAnalysis);
newAnalysisBtn.addEventListener('click', resetForm);
downloadBtn.addEventListener('click', downloadReport);

// Start Analysis
async function startAnalysis() {
  const jobUrl = jobUrlInput.value.trim();
  const resume = resumeInput.value.trim();
  const linkedin = linkedinInput.value.trim();

  if (!jobUrl || !resume) {
    alert('Please provide both Job URL and Resume');
    return;
  }

  // Hide input, show progress
  inputSection.style.display = 'none';
  progressSection.style.display = 'block';
  resultsSection.style.display = 'none';

  try {
    // Call analysis API
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobUrl, resume, linkedin })
    });

    if (!response.ok) throw new Error('Analysis failed');

    // Stream progress updates
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          updateProgress(data);
        }
      }
    }

  } catch (error) {
    console.error('Analysis error:', error);
    progressText.textContent = '❌ Analysis failed. Please try again.';
    setTimeout(resetForm, 3000);
  }
}

// Update Progress
function updateProgress(data) {
  const { step, total, message, status, report } = data;

  // Update progress bar
  const percentage = (step / total) * 100;
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = message;

  // Update timeline step
  const stepElement = document.querySelector(`[data-step="${step}"]`);
  if (stepElement) {
    // Mark all previous as completed
    for (let i = 1; i < step; i++) {
      const prev = document.querySelector(`[data-step="${i}"]`);
      if (prev && !prev.classList.contains('completed')) {
        prev.classList.remove('active');
        prev.classList.add('completed');
        prev.querySelector('.step-status').textContent = '✅ Completed';
      }
    }

    // Mark current as active
    stepElement.classList.add('active');
    stepElement.classList.remove('completed');
    stepElement.querySelector('.step-status').textContent = message;
  }

  // Final status
  if (status === 'complete' && report) {
    document.querySelectorAll('.step').forEach(step => {
      step.classList.remove('active');
      step.classList.add('completed');
      step.querySelector('.step-status').textContent = '✅ Completed';
    });

    progressFill.style.width = '100%';

    setTimeout(() => {
      showResults(report);
    }, 500);
  }
}

// Show Results
function showResults(report) {
  currentReport = report;

  // Convert markdown into HTML
  const html = marked.parse(report, {
    highlight: function (code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  });

  reportContent.innerHTML = html;

  progressSection.style.display = 'none';
  resultsSection.style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reset Form
function resetForm() {
  inputSection.style.display = 'block';
  progressSection.style.display = 'none';
  resultsSection.style.display = 'none';

  // Reset progress bar + message
  progressFill.style.width = '0';
  progressText.textContent = 'Starting analysis...';

  // Reset timeline completely
  document.querySelectorAll('.step').forEach(step => {
    step.classList.remove('active', 'completed');
    step.querySelector('.step-status').textContent = '⏳ Pending';
  });

  // Clear inputs
  jobUrlInput.value = '';
  resumeInput.value = '';
  linkedinInput.value = '';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Download Report
function downloadReport() {
  const blob = new Blob([currentReport], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-analysis-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// Load sample data (demo mode)
function loadExample() {
  jobUrlInput.value = 'https://jobs.ashbyhq.com/softlight/b5945d6e-5add-4afc-8c28-1716875df412';
  resumeInput.value = `Name: Alex Chen
Role: Senior Frontend Engineer

Skills: React, TypeScript, Deno, Node.js, Tailwind CSS

Experience:
- 3 years building e-commerce dashboards
- Led a team of 4 developers
- Improved performance by 40%`;
}

if (window.location.search.includes('demo')) {
  loadExample();
}
