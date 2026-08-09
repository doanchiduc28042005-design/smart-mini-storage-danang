async function test() {
  try {
    console.log('Fetching shippers list...');
    const listRes = await fetch('https://smart-mini-storage-danang.onrender.com/api/shippers');
    const shippers = await listRes.json();
    
    console.log(`Found ${shippers.length} shippers`);
    const nvb = shippers.find(s => s.name === 'Nguyễn Văn B');
    
    if (!nvb) {
      console.log('Nguyễn Văn B not found');
      return;
    }
    
    console.log('Found Nguyễn Văn B, ID:', nvb.id);
    console.log('Has license_photo in list?', !!nvb.license_photo);
    
    console.log(`Fetching details for ${nvb.id}...`);
    const detailRes = await fetch(`https://smart-mini-storage-danang.onrender.com/api/shippers/${nvb.id}`);
    const details = await detailRes.json();
    
    console.log('Has license_photo in details?', !!details.license_photo);
    if (details.license_photo) {
      console.log('Photo length:', details.license_photo.length);
    }
    
  } catch (err) {
    console.error(err.message);
  }
}

test();
