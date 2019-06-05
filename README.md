# Luna
Luna is an opinionated command line tool for deploying single page applications to AWS. It provisions the necessary AWS resources and handles uploading build artifacts to S3.

### Resources
* S3 Bucket
* CloudFront Distribution
* CloudFront Origin Access Identity

### Usage
To deploy a project:
```
npx luna deploy <project-name> <distribution-folder>
```

To destroy an existing project: 
```
npx luna deploy <project-name> <distribution-folder>
```

**NOTE:** This assumes that you have the appropriate AWS environment variables setup in your executable environment (ie `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`). 

### Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "cloudfront:*",
                "s3:HeadBucket"
            ],
            "Resource": "*"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::<bucket-name>",
                "arn:aws:s3:::<bucket-name>/*"
            ]
        }
    ]
}
```
