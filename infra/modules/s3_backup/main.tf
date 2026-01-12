variable "project"     { type = string }
variable "environment" { type = string }

resource "aws_s3_bucket" "backup" {
  bucket = "${var.project}-${var.environment}-backup-${random_id.suffix.hex}"
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "ver" {
  bucket = aws_s3_bucket.backup.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "enc" {
  bucket = aws_s3_bucket.backup.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

output "bucket_name" { value = aws_s3_bucket.backup.bucket }
