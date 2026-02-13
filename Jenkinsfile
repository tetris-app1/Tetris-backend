pipeline {
  agent any

  environment {
    APP_NAME = "tetris-backend"
    BUILD_DIR = "build-artifacts"

    IMAGE_NAME = "tetris-backend"
    IMAGE_TAG  = "${BUILD_NUMBER}"
    FULL_IMAGE = "${IMAGE_NAME}:${IMAGE_TAG}"

    // AWS ECR Configuration
    AWS_REGION   = "us-east-1"
    ECR_REGISTRY = "101561167685.dkr.ecr.us-east-1.amazonaws.com"
    ECR_REPO     = "tetris-backend"
  }

  stages {

    /* =======================
       Checkout Backend Repo
    ======================= */
    stage('Checkout') {
      steps {
        git branch: 'prod',
            credentialsId: 'Creds-git',
            url: 'https://github.com/tetris-app1/Tetris-backend'
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
       Push Image to AWS ECR (NEW REGISTRY)
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
       Checkout Application Repo
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
       Update Backend Image
    ======================= */
    stage('Update Image in Repo') {
      steps {
        dir('application-repoapps/k8sfilesapp1') {
          withCredentials([usernamePassword(
            credentialsId: 'Creds-k8s',
            usernameVariable: 'GIT_USER',
            passwordVariable: 'GIT_PASS'
          )]) {
            sh '''
              git pull --rebase origin main || true

              sed -i "s|image:.*|image: ${ECR_REGISTRY}/${ECR_REPO}:${BUILD_NUMBER}|g" \
              apps/k8sfilesapp1/backend_deployment.yaml

              git config user.email "jenkins@ci.local"
              git config user.name  "Jenkins CI"

              git add k8s_files/backend_deployment.yaml
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
        curl -X POST http://192.168.163.129:5678/webhook/jenkins/backend \
          -H "Content-Type: application/json" \
          -d "{
            \\"status\\": \\"SUCCESS\\",
            \\"service\\": \\"BACKEND\\",
            \\"image\\": \\"${ECR_REGISTRY}/${ECR_REPO}:${BUILD_NUMBER}\\"
          }"
      '''
    }

    failure {
      sh '''
        curl -X POST http://192.168.163.129:5678/webhook/jenkins/backend \
          -H "Content-Type: application/json" \
          -d "{
            \\"status\\": \\"FAILED\\",
            \\"service\\": \\"BACKEND\\"
          }"
      '''
    }

    always {
      echo "Backend Pipeline Finished"
    }
  }
}
