# Luna
Luna is an opinionated command line tool for deploying single page applications to AWS. It provisions the necessary AWS resources and handles uploading build artifacts to S3. 

The primary purpose of Luna is to automate the infrastructure necessary for hosting single page web applications. Other frameworks and tools like Terraform and Ansible are great for projects with lots of resources. However, they require a substantial amount of installation and setup that might not be worth it for every project. Luna runs in a Node.JS executable environment, which means the only thing you need to have installed is Node.JS. It also means you could potentially use the same server to deploy your project as you do to build and run unit tests.

### Resources
Luna uses a CloudFormation stack to define and allocate AWS resources. Along with the CloudFormation stack, the following resources will be provisioned when you run the deployment script (Note: it will prompt you with a brief summary before executing the stack): 
* S3 Bucket
* CloudFront Distribution
* CloudFront Origin Access Identity

### Usage
To deploy a project:
```
npx @curtis.hughes/luna deploy <project-name> <distribution-folder>
```

To destroy an existing project: 
```
npx @curtis.hughes/luna destroy <project-name>
```

**NOTE:** This assumes that you have the appropriate AWS environment variables setup in your executable environment (ie `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`). 

### Flags
```bash
-s, --sync # Synchronously wait for resources to be deployed/destroyed
-y, --yes  # Automatically reply yes for all prompts.
```

