# 🎮 Tetris Backend – DevSecOps Enabled API

Backend service for the Tetris project, built with Node.js and Redis, providing leaderboard functionality.  
This repository includes a complete DevSecOps CI/CD pipeline with security and quality stages.

---

## 🚀 Features

- REST API using Express.js  
- Redis-based leaderboard (sorted sets)  
- Dockerized application (multi-stage build)  
- Automated CI/CD with Jenkins  
- Security scanning (Dependencies + Container Image)  
- Code quality analysis  
- Artifact management  
- Deployment to AWS ECR  

---

## 🧱 Tech Stack

- Node.js (Express)
- Redis
- Docker
- Jenkins
- OWASP Dependency Check
- SonarQube
- Trivy
- Nexus Repository
- AWS ECR

---

## 📂 Project Structure

```text
.
├── Dockerfile
├── jenkinsfile
├── package.json
├── server.js
└── README.md
``` 
##  CI/CD Pipeline Overview

The Jenkins pipeline performs the following stages:

Backend Build (npm install inside container)

OWASP Dependency Check (soft fail)

SonarQube Code Analysis

Package build artifacts and upload to Nexus

Docker Image Build

Trivy Image Vulnerability Scan (soft fail)

Push Image to AWS ECR

Archive Security Reports

All security stages are configured as soft gates to allow pipeline continuation.

Generated reports:

OWASP Dependency Check (HTML)

Trivy Image Scan (table)

These are archived as Jenkins artifacts.

## 📦 Artifacts

Backend build ZIP is uploaded to Nexus

Security reports are archived in Jenkins:

owasp-report/

trivy-image.txt

## ☁️ Deployment

Docker images are pushed to AWS ECR using the Jenkins AWS agent.

Image format:

tetris-backend:<build-number>
