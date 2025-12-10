import type { ZypherAgent } from "@corespeed/zypher";

export interface CareerVisualization {
  skills_radar_html: string;
  timeline_svg: string;
}

export async function generateCareerVisualizations(
  agent: ZypherAgent,
  currentProfile: any,
  targetJob: any,
  gaps: any
): Promise<CareerVisualization> {
  console.log("🎨 Generating career visualizations...");
  
  // 1. Skills Gap Radar Chart (HTML/Canvas)
  const skillsRadarHTML = generateSkillsRadarHTML(currentProfile, targetJob, gaps);
  
  // 2. Timeline SVG
  const timelineSVG = generateTimelineSVG(currentProfile, targetJob, gaps);
  
  console.log("Generated visualizations");
  
  return {
    skills_radar_html: skillsRadarHTML,
    timeline_svg: timelineSVG
  };
}

// Generate Skills Radar HTML
function generateSkillsRadarHTML(profile: any, job: any, gaps: any): string {
  const requiredSkills = job.required_skills?.slice(0, 6) || ['Python', 'JavaScript', 'SQL', 'AWS', 'React', 'Docker'];
  const currentSkills = profile.technical_skills || [];
  
  // Calculate scores (0-100) for each skill
  const skillScores = requiredSkills.map(skill => {
    const hasSkill = currentSkills.some((cs: string) => 
      cs.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(cs.toLowerCase())
    );
    return {
      skill,
      current: hasSkill ? 85 : 20,
      required: 100
    };
  });
  
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skills Radar Chart</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: transparent;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        
        .container {
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
        }
        
        h1 {
            text-align: center;
            color: #e6edf3;
            margin-bottom: 30px;
            font-size: clamp(1.5rem, 4vw, 2rem);
        }
        
        .canvas-wrapper {
            position: relative;
            width: 100%;
            padding-bottom: 100%; /* 1:1 Aspect Ratio */
            margin: 0 auto;
            max-width: 600px;
        }
        
        canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100% !important;
            height: 100% !important;
        }
        
        .legend {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 30px;
            gap: 20px;
            padding: 0 10px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            flex-shrink: 0;
        }
        
        .legend-text {
            color: #e6edf3;
            font-size: 14px;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            h1 {
                margin-bottom: 20px;
                font-size: 1.5rem;
            }
            
            .legend {
                margin-top: 20px;
                gap: 15px;
            }
            
            .legend-text {
                font-size: 13px;
            }
        }
        
        @media (max-width: 480px) {
            h1 {
                font-size: 1.3rem;
            }
            
            .legend {
                flex-direction: column;
                align-items: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Skills Gap Analysis</h1>
        <div class="canvas-wrapper">
            <canvas id="radarChart"></canvas>
        </div>
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color" style="background: rgba(102, 126, 234, 0.5);"></div>
                <span class="legend-text">Your Skills</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: rgba(255, 99, 132, 0.5);"></div>
                <span class="legend-text">Required Skills</span>
            </div>
        </div>
    </div>
    
    <script>
        const skills = ${JSON.stringify(skillScores)};
        
        // Get canvas and set up responsive sizing
        const canvas = document.getElementById('radarChart');
        const ctx = canvas.getContext('2d');
        
        function resizeCanvas() {
            const wrapper = canvas.parentElement;
            const size = wrapper.offsetWidth;
            
            // Set actual canvas size (for sharp rendering)
            canvas.width = size;
            canvas.height = size;
            
            // Redraw
            drawRadar();
        }
        
        function drawRadar() {
            const size = canvas.width;
            const centerX = size / 2;
            const centerY = size / 2;
            const maxRadius = size * 0.38; // 38% of canvas size for padding
            
            // Clear canvas
            ctx.clearRect(0, 0, size, size);
            
            // Draw radar background
            drawRadarBackground(centerX, centerY, maxRadius, size);
            
            // Draw skill polygons
            drawSkillPolygon(skills.map(s => s.required), 'rgba(255, 99, 132, 0.2)', centerX, centerY, maxRadius);
            drawSkillPolygon(skills.map(s => s.current), 'rgba(102, 126, 234, 0.2)', centerX, centerY, maxRadius);
        }
        
        function drawRadarBackground(centerX, centerY, maxRadius, canvasSize) {
            ctx.strokeStyle = '#30363d';
            ctx.lineWidth = Math.max(1, canvasSize / 600);
            
            // Concentric circles
            for (let i = 1; i <= 5; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, maxRadius * i / 5, 0, 2 * Math.PI);
                ctx.stroke();
            }
            
            // Radial lines and labels
            const angleStep = (2 * Math.PI) / skills.length;
            const fontSize = Math.max(12, canvasSize / 50);
            ctx.font = fontSize + 'px sans-serif';
            
            skills.forEach((skill, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const x = centerX + maxRadius * Math.cos(angle);
                const y = centerY + maxRadius * Math.sin(angle);
                
                // Line
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x, y);
                ctx.stroke();
                
                // Label (with better positioning)
                const labelDistance = maxRadius * 1.25;
                const labelX = centerX + labelDistance * Math.cos(angle);
                const labelY = centerY + labelDistance * Math.sin(angle);
                
                ctx.fillStyle = '#e6edf3';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Multi-line text for long skill names on small screens
                const skillName = skill.skill;
                if (canvasSize < 400 && skillName.length > 10) {
                    const words = skillName.split(' ');
                    if (words.length > 1) {
                        ctx.fillText(words[0], labelX, labelY - fontSize / 2);
                        ctx.fillText(words.slice(1).join(' '), labelX, labelY + fontSize / 2);
                    } else {
                        ctx.fillText(skillName, labelX, labelY);
                    }
                } else {
                    ctx.fillText(skillName, labelX, labelY);
                }
            });
        }
        
        function drawSkillPolygon(scores, color, centerX, centerY, maxRadius) {
            const angleStep = (2 * Math.PI) / skills.length;
            const lineWidth = Math.max(2, canvas.width / 300);
            
            ctx.fillStyle = color;
            ctx.strokeStyle = color.replace('0.2', '0.8');
            ctx.lineWidth = lineWidth;
            
            ctx.beginPath();
            scores.forEach((score, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const radius = maxRadius * score / 100;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        
        // Initial draw
        resizeCanvas();
        
        // Redraw on window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeCanvas, 100);
        });
    </script>
</body>
</html>`;
}

// Generate Timeline SVG directly 
function generateTimelineSVG(profile: any, job: any, gaps: any): string {
  const skills = gaps.technical_missing?.slice(0, 6) || ['Skill 1', 'Skill 2', 'Skill 3'];
  
  // Escape XML special characters
  const escapeXML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  const currentRole = escapeXML(profile.title || 'Current Role');
  const targetRole = escapeXML(job.title || 'Target Role');
  
  // Add viewBox for proper scaling
  return `<svg width="100%" height="100%" viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
  <!-- Background -->
  <rect width="1000" height="400" fill="#f9f9f9"/>
  
  <!-- Title -->
  <text x="500" y="40" text-anchor="middle" font-size="24" font-weight="bold" fill="#333">
    12-Month Career Development Timeline
  </text>
  
  <!-- Timeline line -->
  <line x1="100" y1="200" x2="900" y2="200" stroke="#667eea" stroke-width="4"/>
  
  <!-- Start point -->
  <circle cx="100" cy="200" r="12" fill="#667eea"/>
  <text x="100" y="240" text-anchor="middle" font-size="14" fill="#333">Start</text>
  <text x="100" y="260" text-anchor="middle" font-size="12" fill="#666">${currentRole}</text>
  
  <!-- Q1 Milestone -->
  <circle cx="300" cy="200" r="10" fill="#764ba2"/>
  <text x="300" y="180" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">Q1</text>
  <text x="300" y="240" text-anchor="middle" font-size="12" fill="#666">Learn ${escapeXML(skills[0] || 'Skills')}</text>
  
  <!-- Q2 Milestone -->
  <circle cx="500" cy="200" r="10" fill="#764ba2"/>
  <text x="500" y="180" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">Q2</text>
  <text x="500" y="240" text-anchor="middle" font-size="12" fill="#666">Learn ${escapeXML(skills[1] || 'Skills')}</text>
  
  <!-- Q3 Milestone -->
  <circle cx="700" cy="200" r="10" fill="#764ba2"/>
  <text x="700" y="180" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">Q3</text>
  <text x="700" y="240" text-anchor="middle" font-size="12" fill="#666">Build Projects</text>
  
  <!-- End point -->
  <circle cx="900" cy="200" r="12" fill="#667eea"/>
  <text x="900" y="180" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">Q4</text>
  <text x="900" y="240" text-anchor="middle" font-size="14" fill="#333">Goal</text>
  <text x="900" y="260" text-anchor="middle" font-size="12" fill="#666">${targetRole}</text>
  
  <!-- Legend -->
  <rect x="50" y="320" width="900" height="60" fill="white" stroke="#e0e0e0" stroke-width="1" rx="8"/>
  <text x="500" y="345" text-anchor="middle" font-size="12" fill="#666">
    Quarterly milestones on your path from ${currentRole} to ${targetRole}
  </text>
  <text x="500" y="365" text-anchor="middle" font-size="11" fill="#999">
    Focus on building practical skills through projects and continuous learning
  </text>
</svg>`;
}