package storage

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	appconfig "github.com/masterofsword/support-chat/internal/infra/config"
)

type S3Client struct {
	client *s3.Client
	bucket string
	config appconfig.StorageConfig
	logger *slog.Logger
}

func NewS3Client(ctx context.Context, storageConfig appconfig.StorageConfig, logger *slog.Logger) (*S3Client, error) {
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(storageConfig.Region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(storageConfig.AccessKey, storageConfig.SecretKey, ""),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("load aws cfg: %w", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(strings.TrimSpace(storageConfig.Endpoint))
		o.UsePathStyle = true
	})

	return &S3Client{
		client: client,
		bucket: storageConfig.Bucket,
		config: storageConfig,
		logger: logger,
	}, nil
}

func (s *S3Client) GeneratePresignedUploadURL(ctx context.Context, key string, contentType string) (string, error) {
	presigner := s3.NewPresignClient(s.client)

	req, err := presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(s.config.PresignedTTL) * time.Second
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned upload URL: %w", err)
	}

	return req.URL, nil
}

func (s *S3Client) GeneratePresignedDownloadURL(ctx context.Context, key string) (string, error) {
	presigner := s3.NewPresignClient(s.client)

	req, err := presigner.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(s.config.PresignedTTL) * time.Second
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned download URL: %w", err)
	}

	return req.URL, nil
}

func (s *S3Client) HeadObject(ctx context.Context, key string) (*s3.HeadObjectOutput, error) {
	return s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
}

func (s *S3Client) DeleteObject(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	return err
}
