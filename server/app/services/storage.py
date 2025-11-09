"""
Storage service for S3/MinIO file operations
"""
import os
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from typing import Optional
from datetime import timedelta


class StorageService:
    """Service for handling file storage operations"""

    def __init__(self):
        self.endpoint = os.getenv("S3_ENDPOINT", "http://localhost:9000")
        self.access_key = os.getenv("S3_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("S3_SECRET_KEY", "minioadmin")
        self.bucket_name = os.getenv("S3_BUCKET", "soundfoundry")
        self.use_ssl = not self.endpoint.startswith("http://")

        self.s3_client = boto3.client(
            "s3",
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            config=Config(signature_version="s3v4"),
            use_ssl=self.use_ssl,
            verify=False if not self.use_ssl else True,
        )

        # Ensure bucket exists
        self._ensure_bucket()

    def _ensure_bucket(self):
        """Create bucket if it doesn't exist"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            self.s3_client.create_bucket(Bucket=self.bucket_name)

    def upload_file(
        self, file_path: str, object_key: str, content_type: Optional[str] = None
    ) -> str:
        """Upload a file to S3/MinIO"""
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type

        self.s3_client.upload_file(
            file_path, self.bucket_name, object_key, ExtraArgs=extra_args
        )
        return f"{self.endpoint}/{self.bucket_name}/{object_key}"

    def upload_file_content(
        self, key: str, content: bytes, content_type: str, public: bool = False
    ) -> str:
        """Upload file content (bytes) directly to S3/MinIO"""
        extra_args = {"ContentType": content_type}
        if public:
            extra_args["ACL"] = "public-read"
        
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=content,
            **extra_args
        )
        
        # Return presigned URL for private files, direct URL for public
        if public:
            return f"{self.endpoint}/{self.bucket_name}/{key}"
        else:
            return self.generate_presigned_url(key, expiration=31536000)  # 1 year

    def upload_from_url(self, url: str, object_key: str) -> str:
        """Download from URL and upload to S3/MinIO"""
        import httpx
        import tempfile

        with httpx.Client() as client:
            response = client.get(url)
            response.raise_for_status()

            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                tmp_file.write(response.content)
                tmp_path = tmp_file.name

            try:
                return self.upload_file(tmp_path, object_key)
            finally:
                os.unlink(tmp_path)

    def generate_presigned_url(
        self, object_key: str, expiration: int = 3600
    ) -> str:
        """Generate a presigned URL for temporary access"""
        return self.s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": object_key},
            ExpiresIn=expiration,
        )

    def delete_file(self, object_key: str):
        """Delete a file from S3/MinIO"""
        self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_key)


# Singleton instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get or create storage service instance"""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service

