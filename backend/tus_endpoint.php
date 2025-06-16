<?php
require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: HEAD,POST,PATCH,DELETE");
header("Access-Control-Allow-Headers: Content-Type, Upload-Length, Upload-Offset, Tus-Resumable, Upload-Metadata");

// 1. Set AWS S3 Configuration
$s3 = new Aws\S3\S3Client([
    'version' => 'latest',
    'region'  => '', // Your bucket region
    'credentials' => [
        'key'    => '',      // IAM user key
        'secret' => '',  // IAM user secret
        // Optional: Use temporary session tokens for production
        // 'token'  => 'YOUR_SESSION_TOKEN' 
    ],
]);

// 2. Initialize TUS with S3
$server = new \TusPhp\Tus\Server('file'); // or 'redis' for production

// 3. Set your S3 bucket and path
$server->setUploadDir('/tmp'); // Local buffer (required but not used for S3)
$bucket = 'multipart-test-temporary';
$prefix = 'uploads/'; // S3 folder path

// 4. Handle S3 upload on completion
$server->event()->addListener('tus-server.upload.complete', function (\TusPhp\Events\TusEvent $event) use ($s3, $bucket, $prefix) {
    $file = $event->getFile();
    $key = $prefix . $file->getName();

    // Stream directly to S3
    $s3->putObject([
        'Bucket' => $bucket,
        'Key'    => $key,
        'Body'   => fopen($file->getFilePath(), 'r'),
        'ACL'    => 'private' // or 'public-read'
    ]);

    // Delete local temp file
    unlink($file->getFilePath());
    
    // Optional: Notify your PHP backend
    file_put_contents('uploads.log', "Uploaded: $key\n", FILE_APPEND);
});