 println "CLUBOPS JENKINSFILE LOADED"

pipeline {
    agent {
        label 'students'
    }

    environment {
        REGISTRY = 'ghcr.io'
        BACKEND_IMAGE = 'ghcr.io/theeye-network/clubops-backend'
        FRONTEND_IMAGE = 'ghcr.io/theeye-network/clubops-frontend'
        IMAGE_TAG = 'latest'
        COMPOSE_PROJECT_NAME = 'clubops'
        DOCKER_CREDS = credentials('psgdcgit')
        // Jenkins "Secret file" credential containing the production .env content.
        // Create this in Jenkins with credential ID: clubops-env
        CLUBOPS_ENV_FILE = credentials('theeye-clubops-env')
    }

    stages {
        stage('Login to GHCR') {
            steps {
                sh '''
                    echo "$DOCKER_CREDS_PSW" | docker login $REGISTRY -u "$DOCKER_CREDS_USR" --password-stdin
                '''
            }
        }

        stage('Pull Docker Images') {
            steps {
                sh '''
                    docker pull ${BACKEND_IMAGE}:${IMAGE_TAG}
                    docker pull ${FRONTEND_IMAGE}:${IMAGE_TAG}
                    docker pull nginx:1.25-alpine
                    docker pull postgres:15-alpine
                    docker pull redis:7-alpine
                    docker pull rabbitmq:3.12-management-alpine
                '''
            }
        }

        stage('Prepare Production Env') {
            steps {
                sh '''
                    cp "$CLUBOPS_ENV_FILE" .env
                    chmod 600 .env

                    grep -q '^GOOGLE_CLIENT_ID=' .env || (echo "Missing GOOGLE_CLIENT_ID" && exit 1)
                    grep -q '^GOOGLE_CLIENT_SECRET=' .env || (echo "Missing GOOGLE_CLIENT_SECRET" && exit 1)
                    grep -q '^JWT_SECRET=' .env || (echo "Missing JWT_SECRET" && exit 1)
                    grep -q '^POSTGRES_PASSWORD=' .env || (echo "Missing POSTGRES_PASSWORD" && exit 1)
                    grep -q '^RABBITMQ_DEFAULT_PASS=' .env || (echo "Missing RABBITMQ_DEFAULT_PASS" && exit 1)
                '''
            }
        }

        stage('Deploy ClubOps') {
            steps {
                sh '''
                    IMAGE_TAG=${IMAGE_TAG} docker compose \
                        -p ${COMPOSE_PROJECT_NAME} \
                        -f docker-compose.prod.yml \
                        up -d --remove-orphans
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    sleep 10
                    docker compose -p ${COMPOSE_PROJECT_NAME} -f docker-compose.prod.yml ps
                    curl --fail --show-error --silent http://127.0.0.1:${CLUBOPS_HOST_PORT:-8006}/clubops/api/health
                '''
            }
        }
    }

    post {
        always {
            sh 'docker logout ghcr.io || true'
        }
        success {
            echo 'Successfully deployed ClubOps!'
        }
        failure {
            echo 'ClubOps deployment failed. Check Jenkins logs.'
        }
    }
}
