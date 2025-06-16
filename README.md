For compiling the packages and code of the PHP backend:
composer init --no-interaction

To start the PHP backend:
php -S localhost:5000

for tusd:

./tusd_linux_amd64/tusd \
  -s3-bucket multipart-test-temporary \
  -s3-endpoint s3.amazonaws.com \
  -s3-object-prefix uploads/ \
  -s3-access-key-id AWS_ACCESS_KEY \
  -s3-secret-access-key AWS_SECRET_KEY \
  -s3-region AWS_REGION \
  -port 1080 \
  -behind-proxy


for React frontend:
npm run dev

