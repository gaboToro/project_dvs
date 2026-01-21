locals {
  common_env = <<-ENV
    JWT_SECRET=super-secret-key-for-dev-only
    INTERNAL_SERVICE_TOKEN=dev-internal-token
    SUPABASE_URL=https://ojgzxekngfiejuwunejx.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=sb_secret_PtOswQE4FE97KZRGdVV9Fg_0fdDZECf
    SUPABASE_PG_URI=postgresql://postgres:Gabichotc17500@db.ojgzxekngfiejuwunejx.supabase.co:5432/postgres

    PG_HOST=10.40.11.199
    PG_PORT=5432
    PG_USER=dvs
    PG_PASSWORD=DigitalVoting123
    PG_DATABASE=dvs
    PG_URI=postgresql://dvs:DigitalVoting123@10.40.11.199:5432/dvs

    DASHBOARD_MONGO_URI=mongodb://dvs_user:dvs_pass_123@10.40.11.199:27017/dvs_dashboard?authSource=admin
    MONGO_URI=mongodb://dvs_user:dvs_pass_123@10.40.11.199:27017/dvs_dashboard?authSource=admin

    REDIS_URL=redis://10.40.11.199:6379

    KAFKA_BROKERS=10.40.12.141:9092
    KAFKA_TOPIC_VOTES=votes.cast.v1

    RABBITMQ_URL=amqp://10.40.12.141:5672
    RABBITMQ_QUEUE_EMAIL=emails.send

    RATE_LIMITER_ENABLED=true
    RATE_LIMITER_LIMIT=60
    RATE_LIMITER_WINDOW_SEC=60

    AUDIT_LOGGER_ENABLED=true
    AUDIT_LOGGER_TIMEOUT_MS=800

    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER=digitalvotings@gmail.com
    SMTP_PASS=dahzhglwleinrrbe
    SMTP_FROM=digitalvotings@gmail.com

    BACKUP_ENABLED=false
    BACKUP_CRON=0 2 * * *
    BACKUP_DIR=backups
    BACKUP_PG_ENABLED=true
    BACKUP_MONGO_ENABLED=true
    BACKUP_SUPABASE_ENABLED=false
    BACKUP_USE_DOCKER=false
    BACKUP_PG_DOCKER_URI=postgresql://dvs:DigitalVoting123@10.40.11.199:5432/dvs
    BACKUP_SUPABASE_DNS=8.8.8.8
    BACKUP_SUPABASE_FORCE_IPV4=true
    BACKUP_SUPABASE_HOST_IP=
  ENV

  identity_env = <<-ENV
    CORS_ORIGINS=https://elsertoro-qa.distribuidauce.org
    AUTH_SERVICE_URL=http://auth-service:3001
    USER_SERVICE_URL=http://user-service:3005
    RATE_LIMITER_URL=http://rate-limiter-service:3010

    VOTING_SERVICE_URL=http://10.40.11.144:3002
    BLOCKCHAIN_SERVICE_URL=http://10.40.11.144:3003
    RESULTS_SERVICE_URL=http://10.40.11.144:3004
    ELECTION_SERVICE_URL=http://10.40.11.144:3006
    REPORTING_SERVICE_URL=http://10.40.11.144:3012

    AUDIT_LOG_SERVICE_URL=http://10.40.12.18:3007
    DASHBOARD_SERVICE_URL=http://10.40.12.18:3008

    EMAIL_NOTIFIER_SERVICE_URL=http://10.40.11.250:3009
    SCHEDULER_BACKUP_SERVICE_URL=http://10.40.11.250:3011
  ENV

  user_data_identity = <<-EOF
    #!/bin/bash
    set -e
    dnf update -y
    dnf install -y docker docker-compose-plugin
    systemctl enable docker
    systemctl start docker

    mkdir -p /opt/dvs
    cat > /opt/dvs/common.env <<'ENV'
    ${local.common_env}
    ENV
    cat > /opt/dvs/identity.env <<'ENV'
    ${local.identity_env}
    ENV

    mkdir -p /opt/dvs/sql
    cat > /opt/dvs/sql/init.sql <<'SQL'
    ${file("${path.module}/../../sql/init.sql")}
    SQL

    cat > /opt/dvs/docker-compose.yml <<'YAML'
    services:
      api-gateway:
        image: ghcr.io/gaboToro/api-gateway:qa
        env_file:
          - /opt/dvs/common.env
          - /opt/dvs/identity.env
        environment:
          PORT: "3000"
        ports:
          - "3000:3000"
        restart: unless-stopped

      auth-service:
        image: ghcr.io/gaboToro/auth-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3001"
        ports:
          - "3001:3001"
        restart: unless-stopped

      user-service:
        image: ghcr.io/gaboToro/user-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3005"
        ports:
          - "3005:3005"
        restart: unless-stopped

      rate-limiter-service:
        image: ghcr.io/gaboToro/rate-limiter-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3010"
        ports:
          - "3010:3010"
        restart: unless-stopped
    YAML

    docker compose -f /opt/dvs/docker-compose.yml up -d
  EOF

  user_data_business = <<-EOF
    #!/bin/bash
    set -e
    dnf update -y
    dnf install -y docker docker-compose-plugin
    systemctl enable docker
    systemctl start docker

    mkdir -p /opt/dvs
    cat > /opt/dvs/common.env <<'ENV'
    ${local.common_env}
    ENV

    cat > /opt/dvs/docker-compose.yml <<'YAML'
    services:
      election-service:
        image: ghcr.io/gaboToro/election-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3006"
        ports:
          - "3006:3006"
        restart: unless-stopped

      voting-service:
        image: ghcr.io/gaboToro/voting-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3002"
        ports:
          - "3002:3002"
        restart: unless-stopped

      results-service:
        image: ghcr.io/gaboToro/results-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3004"
        ports:
          - "3004:3004"
        restart: unless-stopped

      blockchain-service:
        image: ghcr.io/gaboToro/blockchain-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3003"
        ports:
          - "3003:3003"
        restart: unless-stopped

      reporting-service:
        image: ghcr.io/gaboToro/reporting-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3012"
        ports:
          - "3012:3012"
        restart: unless-stopped
    YAML

    docker compose -f /opt/dvs/docker-compose.yml up -d
  EOF

  user_data_trust = <<-EOF
    #!/bin/bash
    set -e
    dnf update -y
    dnf install -y docker docker-compose-plugin
    systemctl enable docker
    systemctl start docker

    mkdir -p /opt/dvs
    cat > /opt/dvs/common.env <<'ENV'
    ${local.common_env}
    ENV

    cat > /opt/dvs/docker-compose.yml <<'YAML'
    services:
      audit-log-service:
        image: ghcr.io/gaboToro/audit-log-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3007"
        ports:
          - "3007:3007"
        restart: unless-stopped

      dashboard-service:
        image: ghcr.io/gaboToro/dashboard-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3008"
        ports:
          - "3008:3008"
        restart: unless-stopped
    YAML

    docker compose -f /opt/dvs/docker-compose.yml up -d
  EOF

  user_data_support = <<-EOF
    #!/bin/bash
    set -e
    dnf update -y
    dnf install -y docker docker-compose-plugin
    systemctl enable docker
    systemctl start docker

    mkdir -p /opt/dvs
    cat > /opt/dvs/common.env <<'ENV'
    ${local.common_env}
    ENV

    cat > /opt/dvs/docker-compose.yml <<'YAML'
    services:
      email-notifier-service:
        image: ghcr.io/gaboToro/email-notifier-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3009"
        ports:
          - "3009:3009"
        restart: unless-stopped

      scheduler-backup-service:
        image: ghcr.io/gaboToro/scheduler-backup-service:qa
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3011"
        ports:
          - "3011:3011"
        restart: unless-stopped
    YAML

    docker compose -f /opt/dvs/docker-compose.yml up -d
  EOF

  user_data_data = <<-EOF
    #!/bin/bash
    set -e
    dnf update -y
    dnf install -y docker docker-compose-plugin
    systemctl enable docker
    systemctl start docker

    mkdir -p /opt/dvs
    cat > /opt/dvs/docker-compose.yml <<'YAML'
    services:
      postgres:
        image: postgres:16
        container_name: dvs-postgres
        restart: unless-stopped
        environment:
          POSTGRES_USER: dvs
          POSTGRES_PASSWORD: DigitalVoting123
          POSTGRES_DB: dvs
        ports:
          - "5432:5432"
        volumes:
          - dvs_pg:/var/lib/postgresql/data
          - /opt/dvs/sql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U dvs -d dvs"]
          interval: 5s
          timeout: 5s
          retries: 10

      mongo:
        image: mongo:7
        container_name: dvs-mongo
        restart: unless-stopped
        environment:
          MONGO_INITDB_ROOT_USERNAME: dvs_user
          MONGO_INITDB_ROOT_PASSWORD: dvs_pass_123
        ports:
          - "27017:27017"
        volumes:
          - dvs_mongo:/data/db

      redis:
        image: redis:7
        container_name: dvs-redis
        restart: unless-stopped
        ports:
          - "6379:6379"

    volumes:
      dvs_pg:
      dvs_mongo:
    YAML

    docker compose -f /opt/dvs/docker-compose.yml up -d
  EOF

  user_data_messaging = <<-EOF
    #!/bin/bash
    set -e
    dnf update -y
    dnf install -y docker docker-compose-plugin
    systemctl enable docker
    systemctl start docker

    PRIVATE_IP=$$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
    mkdir -p /opt/dvs
    cat > /opt/dvs/docker-compose.yml <<EOF
    services:
      zookeeper:
        image: confluentinc/cp-zookeeper:7.6.1
        container_name: dvs-zk
        restart: unless-stopped
        environment:
          ZOOKEEPER_CLIENT_PORT: 2181
          ZOOKEEPER_TICK_TIME: 2000
        ports:
          - "2181:2181"

      kafka:
        image: confluentinc/cp-kafka:7.6.1
        container_name: dvs-kafka
        restart: unless-stopped
        depends_on:
          - zookeeper
        ports:
          - "9092:9092"
        environment:
          KAFKA_BROKER_ID: 1
          KAFKA_ZOOKEEPER_CONNECT: dvs-zk:2181
          KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://$${PRIVATE_IP}:9092,PLAINTEXT_INTERNAL://dvs-kafka:29092
          KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,PLAINTEXT_INTERNAL://0.0.0.0:29092
          KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_INTERNAL:PLAINTEXT
          KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT_INTERNAL
          KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

      rabbitmq:
        image: rabbitmq:3-management
        container_name: dvs-rabbit
        restart: unless-stopped
        ports:
          - "5672:5672"
          - "15672:15672"
    EOF

    docker compose -f /opt/dvs/docker-compose.yml up -d
  EOF

  user_data_frontend = <<-EOF
    #!/bin/bash
    set -e
    dnf update -y
    dnf install -y docker docker-compose-plugin
    systemctl enable docker
    systemctl start docker

    mkdir -p /opt/dvs
    cat > /opt/dvs/docker-compose.yml <<'YAML'
    services:
      frontend:
        image: ghcr.io/gaboToro/frontend:qa
        container_name: dvs-frontend
        restart: unless-stopped
        ports:
          - "80:80"
    YAML

    docker compose -f /opt/dvs/docker-compose.yml up -d
  EOF
}

module "network" {
  source = "../modules/network"

  project     = var.project
  environment = var.environment

  vpc_cidr             = var.vpc_cidr
  azs                  = var.azs
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "bastion" {
  source = "../modules/bastion"

  project     = var.project
  environment = var.environment

  vpc_id         = module.network.vpc_id
  subnet_id      = module.network.public_subnet_ids[0]
  my_ip_cidr     = var.my_ip_cidr
  ssh_public_key = var.ssh_public_key
}

module "alb_asg" {
  source = "../modules/alb_asg"

  project     = var.project
  environment = var.environment

  vpc_id             = module.network.vpc_id
  public_subnet_ids  = module.network.public_subnet_ids
  private_subnet_ids = module.network.private_subnet_ids

  key_name      = module.bastion.key_name
  bastion_sg_id = module.bastion.bastion_sg_id
  user_data     = local.user_data_identity
}

module "apigw_edge" {
  source = "../modules/apigw_edge"

  project      = var.project
  environment  = var.environment
  alb_dns_name = module.alb_asg.alb_dns_name
}

module "domain_data" {
  source = "../modules/domain_instance"

  project     = var.project
  environment = var.environment
  name        = "data"

  vpc_id      = module.network.vpc_id
  subnet_id   = module.network.private_subnet_ids[0]
  key_name    = module.bastion.key_name
  bastion_sg_id = module.bastion.bastion_sg_id
  allowed_sg_id = module.alb_asg.app_sg_id

  allowed_ports = [5432, 27017, 6379]
  extra_security_group_ids = [module.alb_asg.app_sg_id]
  user_data = local.user_data_data
}

module "backup" {
  source = "../modules/s3_backup"

  project     = var.project
  environment = var.environment
}

module "cloudwatch" {
  source = "../modules/cloudwatch"

  project     = var.project
  environment = var.environment
}

module "domain_business" {
  source = "../modules/domain_instance"

  project     = var.project
  environment = var.environment
  name        = "business"

  vpc_id      = module.network.vpc_id
  subnet_id   = module.network.private_subnet_ids[0]
  key_name    = module.bastion.key_name
  bastion_sg_id = module.bastion.bastion_sg_id
  allowed_sg_id = module.alb_asg.app_sg_id

  allowed_ports = [3002, 3003, 3004, 3006, 3012]
  extra_security_group_ids = [module.alb_asg.app_sg_id]
  user_data = local.user_data_business
}

module "domain_trust" {
  source = "../modules/domain_instance"

  project     = var.project
  environment = var.environment
  name        = "trust"

  vpc_id      = module.network.vpc_id
  subnet_id   = module.network.private_subnet_ids[1]
  key_name    = module.bastion.key_name
  bastion_sg_id = module.bastion.bastion_sg_id
  allowed_sg_id = module.alb_asg.app_sg_id

  allowed_ports = [3007, 3008]
  extra_security_group_ids = [module.alb_asg.app_sg_id]
  user_data = local.user_data_trust
}

module "domain_support" {
  source = "../modules/domain_instance"

  project     = var.project
  environment = var.environment
  name        = "support"

  vpc_id      = module.network.vpc_id
  subnet_id   = module.network.private_subnet_ids[0]
  key_name    = module.bastion.key_name
  bastion_sg_id = module.bastion.bastion_sg_id
  allowed_sg_id = module.alb_asg.app_sg_id

  allowed_ports = [3009, 3011]
  extra_security_group_ids = [module.alb_asg.app_sg_id]
  user_data = local.user_data_support
}


module "domain_messaging" {
  source = "../modules/domain_instance"

  project     = var.project
  environment = var.environment
  name        = "messaging"

  vpc_id      = module.network.vpc_id
  subnet_id   = module.network.private_subnet_ids[1]
  key_name    = module.bastion.key_name
  bastion_sg_id = module.bastion.bastion_sg_id
  allowed_sg_id = module.alb_asg.app_sg_id

  allowed_ports = [2181, 9092, 29092, 5672, 15672]
  extra_security_group_ids = [module.alb_asg.app_sg_id]
  user_data = local.user_data_messaging
}

module "frontend" {
  source = "../modules/frontend_instance"

  project     = var.project
  environment = var.environment
  name        = "frontend"

  vpc_id    = module.network.vpc_id
  subnet_id = module.network.public_subnet_ids[0]
  key_name  = module.bastion.key_name
  bastion_sg_id = module.bastion.bastion_sg_id
  user_data = local.user_data_frontend
}
