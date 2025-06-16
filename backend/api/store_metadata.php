<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Headers must come before output
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Tus-Resumable");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Stop execution and return a 200 response
    http_response_code(200);
    exit;
}

try {
    $input = file_get_contents('php://input');
    if (empty($input)) {
        throw new Exception("No input data");
    }

    $data = json_decode($input, true);
    $uploadId = uniqid('upl_');

    // Debug output (view in browser Network tab)
    error_log("Received: " . print_r($data, true));

    echo json_encode([
        'success' => true,
        'uploadId' => $uploadId,
        'debug' => $data // Echo back received data for verification
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage(),
        'trace' => $e->getTrace() // Only in development!
    ]);
}