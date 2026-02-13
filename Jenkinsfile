pipeline {
  agent any

  environment {
    APP_NAME = "tetris-backend"

    IMAGE_NAME = "tetris-backend"
    IMAGE_TAG  = "${BUILD_NUMBER}"
    FULL_IMAGE = "${IMAGE_NAME}:${IMAGE_TAG}"

    AWS_REGION   = "us-east-1"
    ECR_REGISTRY = "101561167685.dkr.ecr.us-east-1.amazonaws.com"
    ECR_REPO     = "tetris-backend"
    
    SONAR_HOST = "http://localhost:9000"
  }

  stages {

    /* =======================
       Checkout Backend Repo (prod branch)
    ======================= */
    stage('Checkout Backend') {
      steps {
        git branch: 'prod',
            credentialsId: 'Creds-git',
            url: 'https://github.com/tetris-app1/Tetris-backend'
      }
    }

    /* =======================
       SonarQube Scan (Local)
    ======================= */
    stage('SonarQube Analysis') {
      steps {
        withCredentials([string(credentialsId: 'sonar-creds', variable: 'SONAR_TOKEN')]) {
          sh '''
            docker run --rm \
              --network host \
              -v $PWD:/usr/src \
              sonarsource/sonar-scanner-cli \
              -Dsonar.projectKey=tetris-backend \
              -Dsonar.sources=. \
              -Dsonar.host.url=${SONAR_HOST} \
              -Dsonar.login=$SONAR_TOKEN || true
          '''
        }
      }
    }

    /* =======================
       Docker Build
    ======================= */
    stage('Docker Build') {
      steps {
        sh '''
          docker build -t ${FULL_IMAGE} .
        '''
      }
    }

    /* =======================
       Trivy Image Scan
    ======================= */
    stage('Trivy Security Scan') {
      steps {
        sh '''
          mkdir -p security-reports

          trivy image ${FULL_IMAGE} \
            --format table || true

          trivy image ${FULL_IMAGE} \
            --format template \
            --template "@contrib/html.tpl" \
            --output security-reports/trivy-report.html || true
        '''
      }
    }

    /* =======================
       Push Image to AWS ECR
    ======================= */
    stage('Push Image to AWS ECR') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'aws-creds',
          usernameVariable: 'AWS_ACCESS_KEY_ID',
          passwordVariable: 'AWS_SECRET_ACCESS_KEY'
        )]) {
          sh '''
            export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
            export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
            export AWS_DEFAULT_REGION=${AWS_REGION}

            aws ecr get-login-password --region ${AWS_REGION} | \
              docker login --username AWS --password-stdin ${ECR_REGISTRY}

            docker tag ${FULL_IMAGE} ${ECR_REGISTRY}/${ECR_REPO}:${BUILD_NUMBER}
            docker push ${ECR_REGISTRY}/${ECR_REPO}:${BUILD_NUMBER}
          '''
        }
      }
    }

    /* =======================
       Checkout Application Repo (GitOps Repo)
    ======================= */
    stage('Checkout Application Repo') {
      steps {
        dir('application-repo') {
          git branch: 'main',
              credentialsId: 'Creds-k8s',
              url: 'https://github.com/tetris-app1/Application_Repo'
        }
      }
    }

    /* =======================
       Update Kubernetes Deployment Image (FIXED PATH)
    ======================= */
    stage('Update Image in K8s Repo') {
      steps {
        dir('application-repo') {
          withCredentials([usernamePassword(
            credentialsId: 'Creds-k8s',
            usernameVariable: 'GIT_USER',
            passwordVariable: 'GIT_PASS'
          )]) {
            sh '''
              git pull --rebase origin main || true

              # المسار الصحيح حسب الريبو
              sed -i "s|image:.*|image: ${ECR_REGISTRY}/${ECR_REPO}:${BUILD_NUMBER}|g" \
              apps/k8sfilesapp1/backend_deployment.yaml

              git config user.email "jenkins@ci.local"
              git config user.name  "Jenkins CI"

              git add apps/k8sfilesapp1/backend_deployment.yaml
              git commit -m "Update backend image to ${BUILD_NUMBER}" || echo "No changes"

              git push https://${GIT_USER}:${GIT_PASS}@github.com/tetris-app1/Application_Repo.git main
            '''
          }
        }
      }
    }
  }

  post {
    success {
      sh '''
        curl -X POST http://localhost:5678/webhook/jenkins/backend \
          -H "Content-Type: application/json" \
          -d "{
            \\"status\\": \\"SUCCESS\\",
            \\"service\\": \\"BACKEND\\",
            \\"image\\": \\"${ECR_REGISTRY}/${ECR_REPO}:${BUILD_NUMBER}\\"
          }" || true
      '''
    }

    failure {
      sh '''
        curl -X POST http://localhost:5678/webhook/jenkins/backend \
          -H "Content-Type: application/json" \
          -d "{
            \\"status\\": \\"FAILED\\",
            \\"service\\": \\"BACKEND\\"
          }" || true
      '''
    }

    always {
      archiveArtifacts artifacts: 'security-reports/**',
                       allowEmptyArchive: true,
                       fingerprint: true
      echo "Backend Pipeline Finished (Local + Sonar + Trivy + ECR)"
    }
  }
}
