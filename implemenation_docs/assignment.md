# Session 11: Certification Challenge

🎬 **Live Session Resources**  
Recorded October 14th  

📅 **Submit Here** (Due October 21 by 7:00 PM ET)  
[Submission Form](https://forms.gle/4viHEd5BgAwW7mbi7)

---

## Overview

Welcome to the middle of the course!  
We’re five weeks in and have covered a lot of ground — enough to be dangerous.  

Now it’s time to align the skills you’ve learned with your long-term goals.

Ask yourself:
- What are your goals for the rest of 2025 and into 2026?  
- How can you build, ship, and share your way toward achieving them?  

This **Certification Challenge** forms the basis for your **Demo Day project.**

---

## Setting (Time & ROI) Expectations

Cohort 7 data: average 23.2 hours to complete the challenge.  
This type of AI Engineering work — scoping problems, building scalable solutions — is highly valuable.  
Estimated consulting value: $10K–$20K per project.

Certified AI Engineers are often top hiring candidates, and many later lead startups or consulting firms.

---

## Introduction

Good production AI applications rely on context.  
You define the context for your Certification Challenge and Demo Day project.

In previous cohorts, instructors provided the context — now you own it.

---

## AI Product Management 😎

AI Product Management asks: **What should I build, ship, and share, and why?**

Key questions:
1. What problem are you trying to solve?  
2. Why is it a problem?  
3. What is your proposed solution?  
4. Why is it the best solution?  
5. Who is your target audience?  

Deliverables:
- 1-sentence problem statement  
- 1–2 paragraphs explaining why it matters for your user  

---

## AI Engineering 🧑‍💻

AI Engineering asks: **How should I build, ship, and share, and why?**

Common trade-offs:
- RAG vs agents vs fine-tuning  
- Vibe-checking vs quantitative evaluation  
- Real vs synthetic data  
- Retrieval vs generation vs reasoning  
- Performance vs cost  

---

## Task 1: Define Your Problem and Audience

You are an **AI Solutions Engineer.**

📝 **Deliverables**
- 1-sentence problem statement  
- 1–2 paragraphs describing why it matters for your user  

💡 **Hints**
- Identify your user and what part of their job you’re automating  
- List likely user questions  
- Reference Demo Day projects from Cohort 6 or 7 for inspiration  

---

## Task 2: Propose a Solution

Now that you’ve defined a problem and audience, articulate a solution.

📝 **Deliverables**
- 1–2 paragraphs describing your solution (look and feel)  
- Describe the tools you’ll use and justify each choice:

| Stack Component | Example | Why |
|-----------------|----------|-----|
| LLM | OpenAI GPT-4 | High reasoning quality |
| Embedding Model | text-embedding-3-large | Efficient dense retrieval |
| Orchestration | LangChain / LangGraph | Modular chaining |
| Vector Database | Qdrant / Pinecone | Fast vector search |
| Monitoring | LangSmith | Trace and debug LLM runs |
| Evaluation | RAGAS | Quantitative retrieval metrics |
| UI | Streamlit / React | Quick prototype interface |

(Optional) Serving & inference setup if you plan to host locally.

🔍 **Questions**
- Where will agents appear in your app?  
- How will you use agentic reasoning?

---

## Task 3: Dealing with Data

You are an **AI Systems Engineer.**  
Identify your data sources and external APIs.

📝 **Deliverables**
- Describe all data sources and APIs  
- Explain your default chunking strategy  
- Justify your design decisions  

💡 **Hints**
- Gather feedback from real users  
- Use RAG (e.g., PDF documents) + external APIs (Tavily, SerpAPI)

**Optional:** Add special datasets for other features.

---

## Task 4: Build an End-to-End Agentic RAG Prototype

📝 **Deliverables**
- Build a full Agentic RAG app  
- Deploy to a local endpoint  
- (Optional) Use OSS models instead of OpenAI API  

---

## Task 5: Create a Golden Test Dataset

You are an **AI Evaluation & Performance Engineer.**

📝 **Deliverables**
- Prepare test data (synthetic or real)  
- Evaluate using RAGAS:  
  - Faithfulness  
  - Response Relevancy  
  - Context Precision  
  - Context Recall  

Provide a table of results and summarize findings.

---

## Task 6: Advanced Retrieval

Improve your RAG pipeline by upgrading retrieval.

📝 **Deliverables**
- Describe the retrieval techniques you’ll implement  
- Justify each method’s relevance to your use case  

**Possible Techniques**
- Cross-encoder rerankers  
- Multi-vector retrievers  
- Fine-tuned embedding models  
- Hybrid keyword + vector search  

---

## Useful Links

- [Slides (Canva)](https://www.canva.com/design/DAG1zZc3t7I/Zu1H6kusUbL-E5QEgCB1zw/edit)  
- [Recording (Zoom)](https://us02web.zoom.us/rec/share/8f-1HZYDnFp7_oMsmW_3kHk5o2f2bEkn0eie21nH2v4esFavQhBQYq74haqQUTZs.S4x00ZkJ-7i_J-ED)  
- [LLM Stack Reference (Google Sheet)](https://docs.google.com/spreadsheets/d/1RDePu_KkcxUejEN_UvB_YYInpj5-LqUHKz6U8zvWWX0/edit?usp=sharing)  
- [A16Z: Emerging Architectures for LLM Applications](https://a16z.com/emerging-architectures-for-llm-applications/)  
- [AI Makerspace Certification](https://aimakerspace.io/certification/#:~:text=LET%27S%20CHAT!-,CERTIFIED%20GRADUATES,-Certified%20Graduates%20are)  
- [Demo Day References](https://www.notion.so/Session-11-Certification-Challenge-26acd547af3d8067b1f3c1bf251654f6?pvs=25)

---
