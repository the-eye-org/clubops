node('students') {
    def REGISTRY = 'ghcr.io'
    def BACKEND_IMAGE = 'ghcr.io/the-eye-org/clubops-backend'
    def FRONTEND_IMAGE = 'ghcr.io/the-eye-org/clubops-frontend'
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

        stage('Inspect ClubOps Host Port') {
            sh '''
                CLUBOPS_PORT="$(grep -E '^CLUBOPS_HOST_PORT=' .env | tail -n 1 | cut -d= -f2- || true)"
                CLUBOPS_PORT="$(printf '%s' "${CLUBOPS_PORT:-8007}" | tr -d '\015"')"
                COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-clubops}"

                echo "Inspecting host port ${CLUBOPS_PORT} before deployment..."
                echo "Docker containers publishing ${CLUBOPS_PORT}:"
                docker ps --filter "publish=${CLUBOPS_PORT}" \
                    --format 'table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Ports}}' || true

                echo "Current ${COMPOSE_PROJECT_NAME} compose containers:"
                docker compose -p ${COMPOSE_PROJECT_NAME} -f docker-compose.prod.yml ps || true

                echo "Host listeners on port ${CLUBOPS_PORT}:"
                if command -v ss >/dev/null 2>&1; then
                    ss -ltnp "sport = :${CLUBOPS_PORT}" || true
                elif command -v lsof >/dev/null 2>&1; then
                    lsof -nP -iTCP:"${CLUBOPS_PORT}" -sTCP:LISTEN || true
                elif command -v netstat >/dev/null 2>&1; then
                    netstat -ltnp 2>/dev/null | grep ":${CLUBOPS_PORT}\\b" || true
                else
                    echo "No ss, lsof, or netstat command available on this Jenkins node."
                fi
            '''
        }

        stage('Stop Existing ClubOps Web Container') {
            sh '''
                CLUBOPS_PORT="$(grep -E '^CLUBOPS_HOST_PORT=' .env | tail -n 1 | cut -d= -f2- || true)"
                CLUBOPS_PORT="$(printf '%s' "${CLUBOPS_PORT:-8007}" | tr -d '\015"')"
                COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-clubops}"

                PORT_CONTAINERS="$(docker ps -q --filter "publish=${CLUBOPS_PORT}" || true)"
                if [ -n "${PORT_CONTAINERS}" ]; then
                    for CONTAINER_ID in ${PORT_CONTAINERS}; do
                        CONTAINER_NAME="$(docker inspect -f '{{.Name}}' "${CONTAINER_ID}" | sed 's#^/##')"
                        CONTAINER_PROJECT="$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' "${CONTAINER_ID}")"

                        if [ "${CONTAINER_PROJECT}" != "${COMPOSE_PROJECT_NAME}" ]; then
                            echo "Port ${CLUBOPS_PORT} is used by non-ClubOps container ${CONTAINER_NAME} (${CONTAINER_ID})."
                            echo "Refusing to stop it automatically."
                            exit 1
                        fi
                    done
                fi

                if docker ps -a --format '{{.Names}}' | grep -qx "${COMPOSE_PROJECT_NAME}-nginx-1"; then
                    echo "Stopping existing ${COMPOSE_PROJECT_NAME}-nginx-1 container..."
                    docker stop "${COMPOSE_PROJECT_NAME}-nginx-1" || true
                    docker rm "${COMPOSE_PROJECT_NAME}-nginx-1" || true
                else
                    echo "No existing ${COMPOSE_PROJECT_NAME}-nginx-1 container to stop."
                fi
            '''
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
                CLUBOPS_PORT="$(grep -E '^CLUBOPS_HOST_PORT=' .env | tail -n 1 | cut -d= -f2- || true)"
                CLUBOPS_PORT="$(printf '%s' "${CLUBOPS_PORT:-8007}" | tr -d '\015"')"
                docker compose -p clubops -f docker-compose.prod.yml ps
                curl --fail --show-error --silent http://127.0.0.1:${CLUBOPS_PORT}/clubops/api/health
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
