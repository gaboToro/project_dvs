provider "aws" {
  region = var.aws_region
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

locals {
  common_env = <<-ENV
    JWT_SECRET=${var.jwt_secret}
    INTERNAL_SERVICE_TOKEN=${var.internal_service_token}
    ADMIN_PASSWORD=${var.admin_password}
    VOTER_PASSWORD=${var.voter_password}
    VOTER_HASH_SECRET=${var.voter_hash_secret}
    SEED_DEFAULT_USERS=${var.seed_default_users}

    SUPABASE_URL=${var.supabase_url}
    SUPABASE_SERVICE_ROLE_KEY=${var.supabase_service_role_key}
    SUPABASE_PG_URI=${var.supabase_pg_uri}

    PG_HOST=${var.core_private_ip}
    PG_PORT=5432
    PG_USER=${var.pg_user}
    PG_PASSWORD=${var.pg_password}
    PG_DATABASE=${var.pg_database}
    PG_URI=postgresql://${var.pg_user}:${var.pg_password}@${var.core_private_ip}:5432/${var.pg_database}

    DASHBOARD_MONGO_USER=${var.dashboard_mongo_user}
    DASHBOARD_MONGO_PASS=${var.dashboard_mongo_pass}
    DASHBOARD_MONGO_DB=${var.dashboard_mongo_db}
    DASHBOARD_MONGO_URI=mongodb://${var.dashboard_mongo_user}:${var.dashboard_mongo_pass}@${var.core_private_ip}:27017/${var.dashboard_mongo_db}?authSource=admin
    MONGO_URI=mongodb://${var.dashboard_mongo_user}:${var.dashboard_mongo_pass}@${var.core_private_ip}:27017/${var.dashboard_mongo_db}?authSource=admin

    REDIS_URL=redis://${var.core_private_ip}:6379

    KAFKA_BROKERS=${var.core_private_ip}:9092
    KAFKA_TOPIC_VOTES=${var.kafka_topic_votes}
    DASHBOARD_CONSUMER_ENABLED=${var.dashboard_consumer_enabled}

    RABBITMQ_URL=amqp://${var.core_private_ip}:5672
    RABBITMQ_QUEUE_EMAIL=${var.rabbitmq_queue_email}
    EMAIL_CONSUMER_ENABLED=${var.email_consumer_enabled}

    RATE_LIMITER_ENABLED=${var.rate_limiter_enabled}
    RATE_LIMITER_LIMIT=${var.rate_limiter_limit}
    RATE_LIMITER_WINDOW_SEC=${var.rate_limiter_window_sec}

    AUDIT_LOGGER_ENABLED=${var.audit_logger_enabled}
    AUDIT_LOGGER_TIMEOUT_MS=${var.audit_logger_timeout_ms}

    SMTP_HOST=${var.smtp_host}
    SMTP_PORT=${var.smtp_port}
    SMTP_SECURE=${var.smtp_secure}
    SMTP_USER=${var.smtp_user}
    SMTP_PASS=${var.smtp_pass}
    SMTP_FROM=${var.smtp_from}

    BACKUP_ENABLED=${var.backup_enabled}
    BACKUP_CRON=${var.backup_cron}
    BACKUP_DIR=${var.backup_dir}
    BACKUP_PG_ENABLED=${var.backup_pg_enabled}
    BACKUP_MONGO_ENABLED=${var.backup_mongo_enabled}
    BACKUP_SUPABASE_ENABLED=${var.backup_supabase_enabled}
    BACKUP_USE_DOCKER=${var.backup_use_docker}
    BACKUP_PG_DOCKER_URI=postgresql://${var.pg_user}:${var.pg_password}@${var.core_private_ip}:5432/${var.pg_database}
    BACKUP_SUPABASE_DNS=${var.backup_supabase_dns}
    BACKUP_SUPABASE_FORCE_IPV4=${var.backup_supabase_force_ipv4}
    BACKUP_SUPABASE_HOST_IP=${var.backup_supabase_host_ip}

    EXPO_PUBLIC_INTERNAL_SERVICE_TOKEN=${var.internal_service_token}
  ENV

  identity_env = <<-ENV
    CORS_ORIGINS=${var.cors_origins}
    AUTH_SERVICE_URL=http://localhost:3001
    USER_SERVICE_URL=http://localhost:3005
    RATE_LIMITER_URL=http://localhost:3010

    VOTING_SERVICE_URL=http://${var.business_private_ip}:3002
    BLOCKCHAIN_SERVICE_URL=http://${var.business_private_ip}:3003
    RESULTS_SERVICE_URL=http://${var.business_private_ip}:3004
    ELECTION_SERVICE_URL=http://${var.business_private_ip}:3006
    REPORTING_SERVICE_URL=http://${var.business_private_ip}:3012

    AUDIT_LOG_SERVICE_URL=http://${var.trust_support_private_ip}:3007
    DASHBOARD_SERVICE_URL=http://${var.trust_support_private_ip}:3008

    EMAIL_NOTIFIER_SERVICE_URL=http://${var.trust_support_private_ip}:3009
    SCHEDULER_BACKUP_SERVICE_URL=http://${var.trust_support_private_ip}:3011
  ENV

  user_data_core = <<-EOF
    #!/bin/bash
    set -e
    dnf update -y
    dnf install -y docker
    systemctl enable docker
    systemctl start docker
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -sSL https://github.com/docker/compose/releases/download/v2.27.1/docker-compose-linux-x86_64 \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

    mkdir -p /opt/dvs/sql
    cat > /opt/dvs/sql/init.sql <<'SQL'
    ${file("${path.module}/../../sql/init.sql")}
    SQL

    cat > /opt/dvs/docker-compose.yml <<'YAML'
    services:
      postgres:
        image: postgres:16
        container_name: dvs-postgres
        restart: unless-stopped
        environment:
          POSTGRES_USER: ${var.pg_user}
          POSTGRES_PASSWORD: ${var.pg_password}
          POSTGRES_DB: ${var.pg_database}
        ports:
          - "5432:5432"
        volumes:
          - dvs_pg:/var/lib/postgresql/data
          - /opt/dvs/sql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U ${var.pg_user} -d ${var.pg_database}"]
          interval: 5s
          timeout: 5s
          retries: 10

      mongo:
        image: mongo:7
        container_name: dvs-mongo
        restart: unless-stopped
        environment:
          MONGO_INITDB_ROOT_USERNAME: ${var.dashboard_mongo_user}
          MONGO_INITDB_ROOT_PASSWORD: ${var.dashboard_mongo_pass}
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
          KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
          KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://${var.core_private_ip}:9092
          KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092
          KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

      rabbitmq:
        image: rabbitmq:3-management
        container_name: dvs-rabbit
        restart: unless-stopped
        ports:
          - "5672:5672"
          - "15672:15672"

      n8n:
        image: n8nio/n8n
        container_name: dvs-n8n
        restart: unless-stopped
        ports:
          - "5678:5678"
        environment:
          N8N_PORT: "5678"
          N8N_HOST: "${var.n8n_host}"
          N8N_PROTOCOL: "http"
          N8N_SECURE_COOKIE: "false"
          GENERIC_TIMEZONE: "${var.n8n_timezone}"
        volumes:
          - n8n_data:/home/node/.n8n

    volumes:
      dvs_pg:
      dvs_mongo:
      n8n_data:
    YAML

    docker compose -f /opt/dvs/docker-compose.yml up -d
  EOF

  user_data_identity = <<-EOF
    #!/bin/bash
    set -e
    dnf update -y
    dnf install -y docker
    systemctl enable docker
    systemctl start docker
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -sSL https://github.com/docker/compose/releases/download/v2.27.1/docker-compose-linux-x86_64 \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

    mkdir -p /opt/dvs
    cat > /opt/dvs/common.env <<'ENV'
    ${local.common_env}
    ENV
    cat > /opt/dvs/identity.env <<'ENV'
    ${local.identity_env}
    ENV

    cat > /opt/dvs/docker-compose.yml <<'YAML'
    services:
      frontend:
        image: ${var.image_repo_prefix}/frontend:${var.image_tag}
        container_name: dvs-frontend
        restart: unless-stopped
        ports:
          - "80:80"

      api-gateway:
        image: ${var.image_repo_prefix}/api-gateway:${var.image_tag}
        env_file:
          - /opt/dvs/common.env
          - /opt/dvs/identity.env
        environment:
          PORT: "3000"
        ports:
          - "3000:3000"
        restart: unless-stopped

      auth-service:
        image: ${var.image_repo_prefix}/auth-service:${var.image_tag}
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3001"
        ports:
          - "3001:3001"
        restart: unless-stopped

      user-service:
        image: ${var.image_repo_prefix}/user-service:${var.image_tag}
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3005"
        ports:
          - "3005:3005"
        restart: unless-stopped

      rate-limiter-service:
        image: ${var.image_repo_prefix}/rate-limiter-service:${var.image_tag}
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
    dnf install -y docker
    systemctl enable docker
    systemctl start docker
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -sSL https://github.com/docker/compose/releases/download/v2.27.1/docker-compose-linux-x86_64 \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

    mkdir -p /opt/dvs
    cat > /opt/dvs/common.env <<'ENV'
    ${local.common_env}
    ENV

    cat > /opt/dvs/docker-compose.yml <<'YAML'
    services:
      election-service:
        image: ${var.image_repo_prefix}/election-service:${var.image_tag}
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3006"
        ports:
          - "3006:3006"
        restart: unless-stopped

      voting-service:
        image: ${var.image_repo_prefix}/voting-service:${var.image_tag}
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3002"
        ports:
          - "3002:3002"
        restart: unless-stopped

      results-service:
        image: ${var.image_repo_prefix}/results-service:${var.image_tag}
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3004"
        ports:
          - "3004:3004"
        restart: unless-stopped

      blockchain-service:
        image: ${var.image_repo_prefix}/blockchain-service:${var.image_tag}
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3003"
        ports:
          - "3003:3003"
        restart: unless-stopped

      reporting-service:
        image: ${var.image_repo_prefix}/reporting-service:${var.image_tag}
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

  user_data_trust_support = <<-EOF
    #!/bin/bash
    set -e
    dnf update -y
    dnf install -y docker
    systemctl enable docker
    systemctl start docker
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -sSL https://github.com/docker/compose/releases/download/v2.27.1/docker-compose-linux-x86_64 \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

    mkdir -p /opt/dvs
    cat > /opt/dvs/common.env <<'ENV'
    ${local.common_env}
    ENV

    cat > /opt/dvs/docker-compose.yml <<'YAML'
    services:
      audit-log-service:
        image: ${var.image_repo_prefix}/audit-log-service:${var.image_tag}
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3007"
        ports:
          - "3007:3007"
        restart: unless-stopped

      dashboard-service:
        image: ${var.image_repo_prefix}/dashboard-service:${var.image_tag}
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3008"
        ports:
          - "3008:3008"
        restart: unless-stopped

      email-notifier-service:
        image: ${var.image_repo_prefix}/email-notifier-service:${var.image_tag}
        env_file:
          - /opt/dvs/common.env
        environment:
          PORT: "3009"
        ports:
          - "3009:3009"
        restart: unless-stopped

      scheduler-backup-service:
        image: ${var.image_repo_prefix}/scheduler-backup-service:${var.image_tag}
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
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-igw"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "${var.project_name}-${var.environment}-public"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr_b
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "${var.project_name}-${var.environment}-public-b"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-public"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "dvs_qa" {
  name        = "${var.project_name}-${var.environment}-sg"
  description = "QA security group with open intra-VPC access"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5678
    to_port     = 5678
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "udp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-sg"
  }
}

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "ALB security group for QA"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-sg"
  }
}

resource "aws_key_pair" "main" {
  key_name   = "${var.project_name}-${var.environment}-key"
  public_key = var.ssh_public_key
}

resource "aws_instance" "core" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type_core
  subnet_id                   = aws_subnet.public.id
  private_ip                  = var.core_private_ip
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.dvs_qa.id]
  key_name                    = aws_key_pair.main.key_name
  user_data                   = local.user_data_core

  tags = {
    Name = "${var.project_name}-${var.environment}-core"
  }
}

resource "aws_launch_template" "identity" {
  name_prefix   = "${var.project_name}-${var.environment}-identity-"
  image_id      = data.aws_ami.al2023.id
  instance_type = var.instance_type_services
  key_name      = aws_key_pair.main.key_name

  vpc_security_group_ids = [aws_security_group.dvs_qa.id]

  user_data = base64encode(local.user_data_identity)

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-${var.environment}-identity"
    }
  }
}

resource "aws_autoscaling_group" "identity" {
  name                      = "${var.project_name}-${var.environment}-identity-asg"
  max_size                  = 2
  min_size                  = 2
  desired_capacity          = 2
  vpc_zone_identifier       = [aws_subnet.public.id, aws_subnet.public_b.id]
  health_check_type         = "ELB"
  health_check_grace_period = 120

  launch_template {
    id      = aws_launch_template.identity.id
    version = "$Latest"
  }

  target_group_arns = [
    aws_lb_target_group.api.arn,
    aws_lb_target_group.frontend.arn
  ]

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-identity"
    propagate_at_launch = true
  }
}

resource "aws_instance" "business" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type_services
  subnet_id                   = aws_subnet.public.id
  private_ip                  = var.business_private_ip
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.dvs_qa.id]
  key_name                    = aws_key_pair.main.key_name
  user_data                   = local.user_data_business

  tags = {
    Name = "${var.project_name}-${var.environment}-business"
  }
}

resource "aws_instance" "trust_support" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type_services
  subnet_id                   = aws_subnet.public.id
  private_ip                  = var.trust_support_private_ip
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.dvs_qa.id]
  key_name                    = aws_key_pair.main.key_name
  user_data                   = local.user_data_trust_support

  tags = {
    Name = "${var.project_name}-${var.environment}-trust-support"
  }
}

resource "aws_lb" "qa" {
  name               = "${var.project_name}-${var.environment}-alb"
  load_balancer_type = "application"
  subnets            = [aws_subnet.public.id, aws_subnet.public_b.id]
  security_groups    = [aws_security_group.alb.id]

  tags = {
    Name = "${var.project_name}-${var.environment}-alb"
  }
}

resource "aws_lb_target_group" "api" {
  name        = "${var.project_name}-${var.environment}-api-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    path                = "/"
    protocol            = "HTTP"
    port                = "3000"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 15
    timeout             = 5
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api-tg"
  }
}

resource "aws_lb_target_group" "frontend" {
  name        = "${var.project_name}-${var.environment}-frontend-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    path                = "/"
    protocol            = "HTTP"
    port                = "80"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 15
    timeout             = 5
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend-tg"
  }
}

resource "aws_lb_target_group" "dashboard" {
  name        = "${var.project_name}-${var.environment}-dashboard-tg"
  port        = 3008
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    path                = "/api/dashboard/health"
    protocol            = "HTTP"
    port                = "3008"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 15
    timeout             = 5
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-dashboard-tg"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.qa.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb_listener_rule" "api_paths" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

resource "aws_lb_listener_rule" "dashboard_paths" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 20

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.dashboard.arn
  }

  condition {
    path_pattern {
      values = ["/dashboard/*"]
    }
  }
}

resource "aws_lb_target_group_attachment" "trust_support_dashboard" {
  target_group_arn = aws_lb_target_group.dashboard.arn
  target_id        = aws_instance.trust_support.id
  port             = 3008
}
