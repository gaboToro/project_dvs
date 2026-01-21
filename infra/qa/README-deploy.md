## Notas de despliegue QA (solo infraestructura)

Esta carpeta contiene el stack de Terraform para QA. Crea:
- VPC, subnets, NAT, ALB + ASG
- API Gateway (opcional, no usado si prefieres ALB como edge)
- Bastion (Jump box) con Elastic IP
- RDS Postgres, EC2 Mongo, EC2 Redis
- Bucket S3 para backups, CloudWatch log groups

### DNS para Cloudflare
Para el setup mas simple en AWS Academy, usa el DNS del ALB:
- Crea un CNAME desde tu subdominio QA hacia el DNS del ALB.

Guarda el URL de API Gateway como respaldo por si luego lo usas.

### Bastion (Elastic IP)
Usa la Elastic IP del bastion para SSH dentro de la VPC. Actualiza
`my_ip_cidr` en `terraform.tfvars` cuando cambie tu IP publica.

### CORS para QA
CORS se configura por variable de entorno:
- `CORS_ORIGINS` es una lista separada por comas de los origenes permitidos.
- Definelo para `api-gateway` y `dashboard-service`.

Ejemplo:
```
CORS_ORIGINS=https://elsertoro-qa.distribuidauce.org,https://qa.elsertoro-qa.distribuidauce.org
```

Nota: los hostnames DNS normalmente no permiten `_`. Confirma el hostname final.

### Rate limiting
El rate limiting se aplica en el middleware del api-gateway y se configura por env:
- `RATE_LIMITER_*` (limite, ventana, URL del servicio)

### Siguiente fase (despliegue)
La infra esta lista, pero la app aun no se despliega.
En la fase de despliegue vamos a:
1) Elegir el metodo mas simple (ej: docker-compose en instancias del ASG).
2) Inyectar variables de entorno en runtime (sin servicios extra de AWS).
3) Agregar CI/CD para construir y publicar imagenes en GHCR.

### Despliegue por dominios (4 instancias)
Para QA vamos a separar por dominio con 4 instancias:
- Identity & Perimeter: api-gateway, auth-service, user-service, rate-limiter-service
- Business & Transactional: election-service, voting-service, results-service, blockchain-service, reporting-service
- Trust & Audit: audit-log-service, dashboard-service
- Support & Notification: email-notifier-service, scheduler-backup-service

Los compose por dominio estan en esta carpeta:
- docker-compose.identity.yml
- docker-compose.business.yml
- docker-compose.trust.yml
- docker-compose.support.yml

### Variables por dominio
Archivos en `env/`:
- common.env (valores compartidos)
- identity.env (URLs de servicios remotos y CORS)
- business.env, trust.env, support.env (overrides opcionales)

Completa los valores `CHANGE_ME` con los IPs privados de las instancias
de cada dominio y con las credenciales de QA.

### Futuro: instancias separadas para datos y mensajeria
Pendiente crear instancias dedicadas para:
- Base de datos (si dejamos de usar RDS/Mongo/Redis gestionados)
- Kafka y RabbitMQ (mensajeria)

Actualizacion: ya se definio el plan para QA con instancias dedicadas:
- data-host: Postgres, Mongo, Redis (docker-compose.data.yml)
- messaging-host: Kafka + RabbitMQ (docker-compose.messaging.yml)
- frontend-host: Nginx para servir la app web (docker-compose.frontend.yml)

En el despliegue, cada instancia levanta su compose correspondiente.

### Arranque automatico con Terraform
Para QA, el `user_data` ya levanta los contenedores.
Con solo `terraform apply`, cada instancia:
- instala Docker
- crea su `docker-compose.yml`
- levanta las imagenes `:qa`

### GHCR (imagenes publicas)
Las imagenes se publican en GHCR con GitHub Actions.
Workflow: `.github/workflows/publish-ghcr.yml`

Imagenes (tag por rama, ej: qa):
- ghcr.io/gaboToro/api-gateway:qa
- ghcr.io/gaboToro/auth-service:qa
- ghcr.io/gaboToro/user-service:qa
- ghcr.io/gaboToro/rate-limiter-service:qa
- ghcr.io/gaboToro/election-service:qa
- ghcr.io/gaboToro/voting-service:qa
- ghcr.io/gaboToro/results-service:qa
- ghcr.io/gaboToro/blockchain-service:qa
- ghcr.io/gaboToro/reporting-service:qa
- ghcr.io/gaboToro/audit-log-service:qa
- ghcr.io/gaboToro/dashboard-service:qa
- ghcr.io/gaboToro/email-notifier-service:qa
- ghcr.io/gaboToro/scheduler-backup-service:qa
- ghcr.io/gaboToro/frontend:qa

Nota: en GHCR debes marcar los paquetes como publicos una vez publicados.

Frontend (EXPO):
- Define la variable de repo `EXPO_PUBLIC_API_BASE_URL` para que el build web use el API QA.
