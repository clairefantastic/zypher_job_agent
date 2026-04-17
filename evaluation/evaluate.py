
from dotenv import load_dotenv
load_dotenv()

from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from datasets import Dataset
import json
import sys
from pathlib import Path
import subprocess
import tempfile
import os
import re

def load_test_cases(filepath: str = "test-cases.json"):
    """Load test cases from JSON file"""
    try:
        with open(filepath) as f:
            data = json.load(f)
        return data['test_cases']
    except FileNotFoundError:
        print(f"Error: {filepath} not found!")
        print("Create test-cases.json with this structure:")
        print("""
{
  "test_cases": [
    {
      "job_description": "Senior Python Engineer, 5+ years, Django, AWS",
      "resume": "Alex Chen, 6 years Python, Django expert, AWS certified",
      "expected_score": 85,
      "expected_gaps": ["Kubernetes", "ML/AI"],
      "ground_truth": "Strong match due to Python/Django expertise and AWS"
    }
  ]
}
        """)
        sys.exit(1)

def run_jobfit_analysis(job_description: str, resume: str):
    # Just return mock data for evaluation testing
    mock_response = {
        'summary': f"The candidate matches the {job_description[:50]}... role with strong technical skills.",
        'score': 85,
        'gaps': ['Kubernetes', 'CI/CD'],
        'strengths': ['Python expertise', 'Cloud experience']
    }
    
    return mock_response 

def prepare_evaluation_data(test_cases):
    """Convert test cases to Ragas format"""
    questions = []
    answers = []
    contexts = []
    ground_truths = []
    
    print("Running analyses...")
    for i, case in enumerate(test_cases):
        print(f"  [{i+1}/{len(test_cases)}] {case['job_description'][:50]}...")
        
        # Run your AI system
        analysis = run_jobfit_analysis(
            case['job_description'],
            case['resume']
        )
        
        # Format for Ragas
        questions.append(
            f"Does this resume match the job: {case['job_description']}"
        )
        answers.append(analysis['summary'])
        contexts.append([case['resume']])  # Resume is the context
        ground_truths.append(case['ground_truth'])
    
    return {
        'question': questions,
        'answer': answers,
        'contexts': contexts,
        'ground_truth': ground_truths
    }

def evaluate_system(test_cases):
    """Run Ragas evaluation"""
    print("\n=== JobFit AI Quality Evaluation ===\n")
    
    # Prepare data
    eval_data = prepare_evaluation_data(test_cases)
    dataset = Dataset.from_dict(eval_data)
    
    print("\nEvaluating with Ragas metrics...")
    
    # Run evaluation
    results = evaluate(
        dataset,
        metrics=[
            faithfulness,        # No hallucinations
            answer_relevancy,    # Stays on topic
            context_precision,   # Uses resume correctly
            context_recall       # Covers key resume points
        ]
    )
    
    return results

def print_results(results):
    """Print formatted results"""
    print("\n" + "="*60)
    print("RESULTS")
    print("="*60 + "\n")
    
    metrics = {
        'faithfulness': ('Faithfulness', 0.90, 'No hallucinations'),
        'answer_relevancy': ('Answer Relevancy', 0.85, 'On-topic responses'),
        'context_precision': ('Context Precision', 0.85, 'Accurate resume use'),
        'context_recall': ('Context Recall', 0.80, 'Comprehensive coverage')
    }
    
    for key, (name, target, description) in metrics.items():
        score = results[key]
        status = "PASS" if score >= target else "NEEDS IMPROVEMENT"
        
        print(f"{name:20} {score:.3f} (target: {target:.2f}) [{status}]")
        print(f"                     {description}")
        print()
    
    # Overall assessment
    avg_score = sum(results.values()) / len(results)
    print(f"{'Average Score':20} {avg_score:.3f}")
    print("\n" + "="*60)
    
    # Recommendations
    print("\nRECOMMENDATIONS:\n")
    if results['faithfulness'] < 0.90:
        print("- Faithfulness low: Add 'DO NOT hallucinate' to prompts")
        print("- Provide more context to the AI")
        print("- Consider temperature reduction\n")
    
    if results['answer_relevancy'] < 0.85:
        print("- Answer relevancy low: Make prompts more specific")
        print("- Add examples of good responses\n")
    
    if results['context_precision'] < 0.85:
        print("- Context precision low: Improve RAG retrieval")
        print("- Ensure resume data is properly structured\n")

def generate_readme_section(results):
    """Generate markdown for README.md"""
    metrics_text = f"""
## Quality Metrics

Evaluated on {len(results)} job-resume pairs using Ragas:

| Metric | Score | Target | Status |
|--------|-------|--------|--------|
| Faithfulness | {results['faithfulness']:.3f} | 0.90 | {'PASS' if results['faithfulness'] >= 0.90 else 'NEEDS WORK'} |
| Answer Relevancy | {results['answer_relevancy']:.3f} | 0.85 | {'PASS' if results['answer_relevancy'] >= 0.85 else 'NEEDS WORK'} |
| Context Precision | {results['context_precision']:.3f} | 0.85 | {'PASS' if results['context_precision'] >= 0.85 else 'NEEDS WORK'} |
| Context Recall | {results['context_recall']:.3f} | 0.80 | {'PASS' if results['context_recall'] >= 0.80 else 'NEEDS WORK'} |

**What these mean**:
- **Faithfulness**: AI doesn't hallucinate skills or experience not in resume
- **Answer Relevancy**: Responses directly address the job match question
- **Context Precision**: AI accurately uses information from the resume
- **Context Recall**: AI captures all relevant resume information
"""
    
    Path("METRICS.md").write_text(metrics_text)
    print("\nSaved metrics to METRICS.md")

if __name__ == "__main__":
    print("JobFit AI - Quality Evaluation")
    print("Using Ragas framework\n")
    
    # Load test cases
    test_cases = load_test_cases("test-cases.json")
    print(f"Loaded {len(test_cases)} test cases\n")
    
    # Run evaluation
    results = evaluate_system(test_cases)
    
    # Print results
    print_results(results)
    
    # Generate README section
    generate_readme_section(results)
    
    print("\nDone! Review results above and improve low-scoring metrics.")