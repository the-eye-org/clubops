node('students') {
    def REGISTRY = 'ghcr.io'
    def BACKEND_IMAGE = 'ghcr.io/theeye-network/clubops-backend'
    def FRONTEND_IMAGE = 'ghcr.io/theeye-network/clubops-frontend'
    def IMAGE_TAG = 'latest'
    def COMPOSE_PROJECT_NAME = 'clubops'

    try {
        stage('Checkout') {
            checkout scm
        }

        stage('Login to GHCR') {
            withCredentials([usernamePassword(credentialsId: 'psgdcgit', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                sh """
                    echo "\$DOCKER_PASS" | docker login ${REGISTRY} -u "\$DOCKER_USER" --password-stdin
                """
            }
        }

        stage('Pull Docker Images') {
            sh """
                docker pull ${BACKEND_IMAGE}:${IMAGE_TAG}
                docker pull ${FRONTEND_IMAGE}:${IMAGE_TAG}
                docker pull nginx:1.25-alpine
                docker pull postgres:15-alpine
                docker pull redis:7-alpine
                docker pull rabbitmq:3.12-management-alpine
            """
        }

        stage('Prepare Production Env') {
            withCredentials([file(credentialsId: 'theeye-clubops-env', variable: 'CLUBOPS_ENV_FILE')]) {
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
            sh """
                IMAGE_TAG=${IMAGE_TAG} docker compose \
                    -p ${COMPOSE_PROJECT_NAME} \
                    -f docker-compose.prod.yml \
                    up -d --remove-orphans
            """
        }

        stage('Health Check') {
            sh '''
                sleep 10
                docker compose -p clubops -f docker-compose.prod.yml ps
                curl --fail --show-error --silent http://127.0.0.1:${CLUBOPS_HOST_PORT:-8006}/clubops/api/health
            '''
        }

        echo 'Successfully deployed ClubOps!'
    } catch (err) {
        echo 'ClubOps deployment failed. Check Jenkins logs.'
        throw err
    } finally {
        sh 'docker logout ghcr.io || true'
    }
}
