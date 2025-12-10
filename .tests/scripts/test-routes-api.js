// Test simple Routes API v2
async function testRoutesAPI() {
    const apiKey = 'AIzaSyBJ8KvY_Xky-B47RKBVqPAMe0_Trnp0_-U';

    const requestBody = {
        origin: { address: 'Salamanca, España' },
        destination: { address: 'París, Francia' },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        languageCode: 'es',
        units: 'METRIC'
    };

    try {
        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log('Response status:', response.status);
        console.log('Result:', JSON.stringify(result, null, 2));

        if (result.routes && result.routes[0]) {
            console.log('✅ Routes API working!');
            console.log('Distance:', result.routes[0].distanceMeters, 'meters');
            console.log('Legs count:', result.routes[0].legs?.length);
        } else {
            console.log('❌ No routes in response');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testRoutesAPI();
