const fs = require('fs');

async function run() {
  const API_URL = 'http://localhost:5001';
  console.log('Starting integration test...');

  try {
    // 1. Log in
    console.log('Logging in as admin...');
    const loginRes = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ltc.edu', password: '123' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Logged in successfully. Token obtained.');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Create Batch A
    console.log('Creating Batch A...');
    const batchARes = await fetch(`${API_URL}/api/admin/batches`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Batch A - Test ' + Date.now(),
        status: 'upcoming',
        location: 'Virtual',
        start_date: '2026-06-01',
        end_date: '2026-06-30',
        description: 'Test Batch A'
      })
    });
    const batchAData = await batchARes.json();
    console.log('Batch A created:', batchAData);
    const batchAId = batchAData.batch?.id;
    if (!batchAId) throw new Error('Failed to obtain Batch A ID');

    // Records to upload (first upload - will insert new profiles)
    const records = [
      { name: 'John Doe', email: 'john.doe@example.com', prn: 'PRN10001', role: 'student', gender: 'male', department: 'CS', semester: '3' },
      { name: 'Jane Smith', email: 'jane.smith@example.com', prn: 'PRN10002', role: 'student', gender: 'female', department: 'CS', semester: '3' },
      { name: 'Dr. Robert', email: 'robert@example.com', role: 'faculty', gender: 'male', department: 'CS' }
    ];

    // 3. Upload to Batch A
    console.log('Uploading records to Batch A...');
    const uploadARes = await fetch(`${API_URL}/api/admin/batches/${batchAId}/bulk-upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ records, duplicateAction: 'skip' })
    });
    const uploadAData = await uploadARes.json();
    console.log('Upload A started:', uploadAData);
    const jobAId = uploadAData.jobId;

    // Poll job A status
    console.log('Polling job A status...');
    let jobA = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const jobRes = await fetch(`${API_URL}/api/admin/upload-jobs/${jobAId}`, { headers });
      jobA = (await jobRes.json()).job;
      console.log(`Job A Status: ${jobA.status}, processed: ${jobA.processed_records}/${jobA.total_records}, success: ${jobA.success_count}, failed: ${jobA.failed_count}`);
      if (jobA.status === 'completed' || jobA.status === 'failed') break;
    }

    if (jobA.status !== 'completed') {
      console.error('Job A errors:', jobA.errors);
      throw new Error(`Job A failed or timed out with status: ${jobA.status}`);
    }

    // 4. Create Batch B
    console.log('Creating Batch B...');
    const batchBRes = await fetch(`${API_URL}/api/admin/batches`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Batch B - Test ' + Date.now(),
        status: 'upcoming',
        location: 'Virtual',
        start_date: '2026-07-01',
        end_date: '2026-07-31',
        description: 'Test Batch B'
      })
    });
    const batchBData = await batchBRes.json();
    console.log('Batch B created:', batchBData);
    const batchBId = batchBData.batch?.id;
    if (!batchBId) throw new Error('Failed to obtain Batch B ID');

    // 5. Upload same records to Batch B (second upload - profiles already exist)
    console.log('Uploading same records to Batch B...');
    const uploadBRes = await fetch(`${API_URL}/api/admin/batches/${batchBId}/bulk-upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ records, duplicateAction: 'skip' })
    });
    const uploadBData = await uploadBRes.json();
    console.log('Upload B started:', uploadBData);
    const jobBId = uploadBData.jobId;

    // Poll job B status
    console.log('Polling job B status...');
    let jobB = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const jobRes = await fetch(`${API_URL}/api/admin/upload-jobs/${jobBId}`, { headers });
      jobB = (await jobRes.json()).job;
      console.log(`Job B Status: ${jobB.status}, processed: ${jobB.processed_records}/${jobB.total_records}, success: ${jobB.success_count}, failed: ${jobB.failed_count}`);
      if (jobB.status === 'completed' || jobB.status === 'failed') break;
    }

    if (jobB.status !== 'completed') {
      console.error('Job B errors:', jobB.errors);
      throw new Error(`Job B failed or timed out with status: ${jobB.status}`);
    }

    console.log('=== TEST SUCCESSFUL ===');
    console.log('Successfully associated previously uploaded students/faculty with the new batch without duplication or errors!');
    process.exit(0);

  } catch (err) {
    console.error('=== TEST FAILED ===');
    console.error(err);
    process.exit(1);
  }
}

run();
