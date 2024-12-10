pipeline {
    agent any
    environment {
        PROJECT_DIR = '/home/shiloh/repo/medu-backend'  // shiloh 用戶的 repo 路徑
    }
    stages {
        stage('Check for Updates') {
            steps {
                script {
                    dir("${PROJECT_DIR}") {
                        // 使用 withCredentials 加載 SSH 密鑰
                        withCredentials([sshUserPrivateKey(credentialsId: '02823815-31df-4987-8fd9-5933fbbe60d2', keyFileVariable: 'SSH_KEY')]) {
                            // 使用 env 传递 SSH 密钥
                            env.SSH_KEY_PATH = '${SSH_KEY}'
                            
                            // 配置 Git，避免在 sh 中直接插值
                            sh """
                            git config --global --add safe.directory "*"
                            git config core.sshCommand "ssh -i ${env.SSH_KEY_PATH} -o StrictHostKeyChecking=no"

                            # 拉取最新的代碼
                            git fetch origin
                            LOCAL_COMMIT=\$(git rev-parse HEAD)
                            REMOTE_COMMIT=\$(git rev-parse @{u})
                            if [ "\$LOCAL_COMMIT" != "\$REMOTE_COMMIT" ]; then
                                echo "New commits detected. Pulling updates..."
                                git pull origin main
                            else
                                echo "No updates found."
                            fi
                            """
                        }
                    }
                }
            }
        }
        stage('Build Project') {
            steps {
                dir("${PROJECT_DIR}/src") {
                    sh '''
                    sudo -u shiloh npm install
                    # 若需要執行測試，啟用下一行
                    sudo -u shiloh npm test
                    # 使用 shiloh 用戶運行 pm2
                    sudo -u shiloh /usr/local/bin/pm2 restart /home/shiloh/repo/medu-backend/src/server.js
                    '''
                }
            }
        }
    }
    post {
        success {
            echo 'Build completed successfully!'
        }
        failure {
            echo 'Build failed. Check logs for details.'
        }
    }
}
