import { useState, useRef } from 'react';
import { Upload } from 'tus-js-client';

const BACKEND_URL = "http://localhost:5000";

interface FileMetadata {
  filename: string;
  filetype: string;
  description?: string;
  userId?: string;
}

function TusUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const sendMetadataToBackend = async (metadata: FileMetadata): Promise<string> => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/store_metadata.php`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Tus-Resumable': '1.0.0'
            },
            body: JSON.stringify(metadata)
        });

        console.log("Full response:", {
            status: response.status,
            statusText: response.statusText,
            headers: [...response.headers.entries()],
            bodyUsed: response.bodyUsed
        });

        // First check if there's any body
        const text = await response.text();
        console.log("Raw response text:", text);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Try parsing only if text exists
        if (text) {
            try {
                const data = JSON.parse(text);
                console.log("Parsed JSON:", data);
                return data.uploadId; // Or whatever field you expect
            } catch (e) {
                console.error("Failed to parse JSON:", e);
                throw new Error("Invalid JSON response");
            }
        } else {
            throw new Error("Empty response body");
        }
    } catch (error) {
        console.error('Metadata error:', error);
        throw error;
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    try {
      // 1. Send metadata to PHP backend
      const uploadId = await sendMetadataToBackend({
        filename: file.name,
        filetype: file.type,
        description,
        userId: "user123" // Replace with actual user ID
      });

      // 2. Start TUS upload to S3
      const upload = new Upload(file, {
        // endpoint: `${BACKEND_URL}/files`, // Your tusd endpoint
        // retryDelays: [0, 1000, 3000, 5000],
        endpoint: 'http://localhost:1080/files',
        metadata: {
          filename: file.name,
          filetype: file.type,
          uploadId // Link to PHP metadata
        },
        onError: (error) => {
          console.error('Upload failed:', error);
          setIsUploading(false);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          setProgress(Number(((bytesUploaded / bytesTotal) * 100).toFixed(2)));
        },
        onSuccess: () => {
          console.log('Upload completed');
          setIsUploading(false);
          setFile(null);
          setDescription("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      });

      upload.start();
    } catch (error) {
      console.error("Metadata error:", error);
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <input
        type="file"
        onChange={handleFileChange}
        ref={fileInputRef}
        disabled={isUploading}
        style={{ display: 'block', marginBottom: '10px' }}
      />

      <textarea
        placeholder="File description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isUploading}
        style={{ width: '100%', marginBottom: '10px', minHeight: '60px' }}
      />

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        style={{
          padding: '10px 15px',
          background: isUploading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {isUploading ? `Uploading... ${progress}%` : 'Upload to S3'}
      </button>

      {isUploading && (
        <progress value={progress} max={100} style={{ width: '100%', marginTop: '10px' }} />
      )}
    </div>
  );
}

export default TusUploader;


// import { useState, useRef } from 'react';
// import type { ChangeEvent } from 'react';
// import { Upload } from 'tus-js-client';

// const BACKEND_URL: string = "http://localhost:5000/";

// function TusUploader() {
//   const [file, setFile] = useState<File | null>(null);
//   const [progress, setProgress] = useState<number>(0);
//   const [isUploading, setIsUploading] = useState<boolean>(false);
//   const fileInputRef = useRef<HTMLInputElement | null>(null);

//   const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setFile(e.target.files[0]);
//     }
//   };

//   const handleUpload = () => {
//     if (!file) return;

//     setIsUploading(true);
//     setProgress(0);

//     const upload = new Upload(file, {
//       endpoint: BACKEND_URL + 'tus_endpoint.php',
//       retryDelays: [0, 1000, 3000, 5000],
//       metadata: {
//         filename: file.name,
//         filetype: file.type,
//       },
//       onError: (error) => {
//         console.error('Upload failed:', error);
//         setIsUploading(false);
//       },
//       onProgress: (bytesUploaded, bytesTotal) => {
//         const percentage = (bytesUploaded / bytesTotal) * 100;
//         setProgress(parseFloat(percentage.toFixed(2)));
//       },
//       onSuccess: () => {
//         console.log('Upload completed');
//         setIsUploading(false);
//         setFile(null);
//         if (fileInputRef.current) {
//           fileInputRef.current.value = '';
//         }
//       },
//     });

//     upload.start();
//   };

//   return (
//     <div style={{ padding: '20px', maxWidth: '500px' }}>
//       <input
//         type="file"
//         onChange={handleFileChange}
//         ref={fileInputRef}
//         disabled={isUploading}
//         style={{ display: 'block', marginBottom: '10px' }}
//       />

//       <button
//         onClick={handleUpload}
//         disabled={!file || isUploading}
//         style={{
//           padding: '10px 15px',
//           background: isUploading ? '#ccc' : '#007bff',
//           color: 'white',
//           border: 'none',
//           borderRadius: '4px',
//           cursor: 'pointer',
//         }}
//       >
//         {isUploading ? 'Uploading...' : 'Upload to S3'}
//       </button>

//       {isUploading && (
//         <div style={{ marginTop: '10px' }}>
//           <progress value={progress} max={100} style={{ width: '100%' }} />
//           <div>{progress}%</div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TusUploader;
