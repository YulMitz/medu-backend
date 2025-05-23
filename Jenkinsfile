pipeline {
    agent any
    environment {
        PROJECT_DIR = '/home/mulkooo/medu-backend'  // mulkooo 用戶的 repo 路徑
    }
    stages {
        stage('Check for Updates') {
            steps {
                script {
                    dir("${PROJECT_DIR}") {
                        // 配置 Git，避免在 sh 中直接插值
                        sh """
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
        stage('Build Project') {
            steps {
                dir("${PROJECT_DIR}/src") {
                    sh '''
                    sudo -nu mulkooo npm install
                    # 若需要執行測試，啟用下一行
                    sudo -nu mulkooo npm test
                    # 使用 shiloh 用戶運行 pm2
                    sudo -nu mulkooo /usr/local/bin/pm2 restart /home/mulkooo/medu-backend/src/server.js
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
