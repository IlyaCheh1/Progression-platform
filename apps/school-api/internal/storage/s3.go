package storage

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Config struct {
	Endpoint     string
	Region       string
	AccessKey    string
	SecretKey    string
	Bucket       string
	PublicBase   string
	PresignedTTL time.Duration
}

func ConfigFromEnv() (Config, bool) {
	endpoint := strings.TrimSpace(os.Getenv("S3_ENDPOINT"))
	accessKey := strings.TrimSpace(os.Getenv("S3_ACCESS_KEY"))
	secretKey := strings.TrimSpace(os.Getenv("S3_SECRET_KEY"))
	bucket := strings.TrimSpace(os.Getenv("S3_BUCKET"))
	if endpoint == "" || accessKey == "" || secretKey == "" || bucket == "" {
		return Config{}, false
	}

	ttlSec := 300
	if raw := strings.TrimSpace(os.Getenv("S3_PRESIGNED_TTL")); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil && n > 0 {
			ttlSec = n
		}
	}

	region := strings.TrimSpace(os.Getenv("S3_REGION"))
	if region == "" {
		region = "ru-7"
	}

	return Config{
		Endpoint:     endpoint,
		Region:       region,
		AccessKey:    accessKey,
		SecretKey:    secretKey,
		Bucket:       bucket,
		PublicBase:   strings.TrimRight(strings.TrimSpace(os.Getenv("S3_PUBLIC_BASE_URL")), "/"),
		PresignedTTL: time.Duration(ttlSec) * time.Second,
	}, true
}

type Client struct {
	client *s3.Client
	cfg    Config
}

func NewClient(ctx context.Context, cfg Config) (*Client, error) {
	awsCfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(cfg.Region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(cfg.AccessKey, cfg.SecretKey, ""),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("load aws cfg: %w", err)
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(cfg.Endpoint)
		o.UsePathStyle = true
	})

	return &Client{client: client, cfg: cfg}, nil
}

func (c *Client) PresignPut(ctx context.Context, key, contentType string) (string, error) {
	presigner := s3.NewPresignClient(c.client)
	req, err := presigner.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.cfg.Bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = c.cfg.PresignedTTL
	})
	if err != nil {
		return "", fmt.Errorf("presign put: %w", err)
	}
	return req.URL, nil
}

func (c *Client) HeadObject(ctx context.Context, key string) error {
	_, err := c.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.cfg.Bucket),
		Key:    aws.String(key),
	})
	return err
}

func (c *Client) PublicURL(key string) string {
	key = strings.TrimLeft(key, "/")
	if c.cfg.PublicBase != "" {
		return c.cfg.PublicBase + "/" + key
	}
	endpoint := strings.TrimRight(c.cfg.Endpoint, "/")
	return fmt.Sprintf("%s/%s/%s", endpoint, c.cfg.Bucket, key)
}
