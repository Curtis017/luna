# Luna
Luna is an opinionated command line tool for deploying single page applications to AWS. It provisions the necessary AWS resources and handles uploading build artifacts to S3.

### Usage
To deploy a project:
```
npx luna deploy <project-name> <distribution-folder>
```

To destroy an existing project: 
```
npx luna deploy <project-name> <distribution-folder>
```

### Resources
* S3 Bucket
* CloudFront Distribution
* CloudFront Origin Access Identity
